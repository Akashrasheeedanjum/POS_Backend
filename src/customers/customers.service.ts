import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Customer } from './Schemas/Customer.schema';
import { isValidObjectId, Model } from 'mongoose';
import { CreateCustomerDto, UpdateCustomerDto } from './dtos/CreateCustomer.dto';
import { Country } from './Schemas/Country.schema';
import { City } from './Schemas/City.schema';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

@Injectable()
export class CustomersService {
    constructor(
    @InjectModel(Customer.name)
    private readonly CustomerModel: Model<Customer>,
    @InjectModel(Country.name)
    private readonly CountryModel: Model<Country>,
    @InjectModel(City.name)
    private readonly CityModel: Model<City>,
    ){}


    async createCustomer(body: CreateCustomerDto){
        const {billingAddress, deliveryAddress, country, customerCode} = body
        const custCode = Array.from(crypto.getRandomValues(new Uint8Array(8)))
       .map((n) => (n % 10).toString())
       .join('');

        if (body.email === null || body.email === undefined || body.email === '') {
          delete body.email;
        }
        if (body.vatNumber === null || body.vatNumber === undefined || body.vatNumber === '') {
          body.vatNumber = '';
        }

        const deliveryCity = body.deliveryAddress?.city;
        const hasDeliveryData =
          body.deliveryAddress?.address?.trim() ||
          (deliveryCity && String(deliveryCity).trim()) ||
          body.deliveryAddress?.zipCode?.trim();
        if (!hasDeliveryData) {
          delete body.deliveryAddress;
        } else if (
          deliveryCity === null ||
          deliveryCity === undefined ||
          String(deliveryCity).trim() === ''
        ) {
          delete body.deliveryAddress!.city;
        }

        if(country){
        if(!isValidObjectId(country)) throw new BadRequestException('Provided Country Id is not valid!')
        const resp = await this.CountryModel.findById(country)
        if(!resp) throw new NotFoundException(`No country with this ID: ${country}`)
        }

        if(deliveryAddress?.city){
        if(!isValidObjectId(deliveryAddress?.city)) throw new BadRequestException('Provided delivery City Id is not valid!')
        const resp = await this.CityModel.findById(deliveryAddress?.city)
        if(!resp) throw new NotFoundException(`No city with this ID: ${deliveryAddress?.city}`)
        }

        if(billingAddress?.city){
        if(!isValidObjectId(billingAddress?.city)) throw new BadRequestException('Provided billing City is not valid!')
        const resp = await this.CityModel.findById(billingAddress?.city)
        if(!resp) throw new NotFoundException(`No city with this ID: ${billingAddress?.city}`)
        }

                // Validate that only one usePriceList field is defined
        const priceListFields = ['usePriceList1', 'usePriceList2', 'usePriceList3', 'usePriceList4'];
        
        // Filter only the fields that are explicitly defined (not undefined)
        const definedPriceLists = priceListFields.filter(
          (key) => body[key as keyof typeof body] !== undefined
        );
        
        // Allow either none or exactly one
        if (definedPriceLists.length > 1) {
          throw new BadRequestException(
            `Only one of usePriceList1, usePriceList2, usePriceList3, or usePriceList4 may be provided at a time.`
          );
        }
  
        try {
        const customer = new this.CustomerModel({
          ...body,
          customerCode: customerCode ?? custCode
        })

        await customer.save()
        await customer.populate([
          { path: 'country' },
          { path: 'billingAddress.city' },
          { path: 'deliveryAddress.city' }
        ])
        
        const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');
          const obj = customer.toObject(); // convert Mongoose document to plain object
          return {
           ...obj,
           createdAt: obj.createdAt ? formatDate(obj.createdAt) : null,
           updatedAt: obj.updatedAt ? formatDate(obj.updatedAt) : null,
         };
        } catch (error) {
        console.error(error)
        if(
            error.code === 11000
          ) {
            const duplicateField = Object.keys(error.keyValue)[0];
            const duplicateValue = error.keyValue[duplicateField];
            throw new ConflictException(
              `Duplicate entry for ${duplicateField}: ${duplicateValue}`
            );
          }
        const errorMessage = error?.response?.message || error?.message || 'An unexpected error occurred';
        throw new InternalServerErrorException(`Error: ${errorMessage}`);
        }

    }

async getCustomerCode() {
  try {
    // Find the last created customer
    const lastCustomer = await this.CustomerModel
      .findOne()
      .sort({ createdAt: -1 })   // latest first
      .select('customerCode');   // only return customerCode
    
    // If no customer exists, start with 1
    if (!lastCustomer || !lastCustomer.customerCode) {
      return 1;
    }

    // Convert to number and increment
    return Number(lastCustomer.customerCode) + 1;

  } catch (error) {
    throw new Error('Failed to generate customer code: ' + error.message);
  }
}


    async getAllCustomers(filter:any, page, pageSize){
      // for pagination of 10 records per page
      try {
      // const pageSize = 10;
      const skip = (page - 1) * pageSize;

      const query: any = {};

      const regexFields = [
        'customerCode',
        'nameDenomination',
        'firstName',
        'tel1',
        'billingAddress.address',
        'billingAddress.zipCode',
        'email',
        'vatNumber',
      ];
      for (const key in filter) {
        if (!filter[key]) continue;
        if (regexFields.includes(key)) {
          query[key] = { $regex: filter[key], $options: 'i' }; //{ firstName: { $regex: 'john', $options: 'i' } }  This allows you to match "John", "JOHN", "jo" — anything that contains "john" in any case.
        } else {
          query[key] = filter[key]; //If the field isn't in regexFields, use an exact match. exact match for things like `country`
        }
      }
      const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');

       if (query.createdAt) {
         const inputDate = dayjs.utc(query.createdAt.trim(), 'YYYY-MM-DD', true); // use utc here
         if (inputDate.isValid()) {
           query.createdAt = {
             $gte: inputDate.startOf('day').toDate(), // now in UTC: 2025-05-02T00:00:00.000Z
             $lte: inputDate.endOf('day').toDate(),   // 2025-05-02T23:59:59.999Z
           };
         } else {
           delete query.createdAt;
           throw new BadRequestException(`Provide date in 'YYYY-MM-DD' format`);
         }
       }

       
      // return
      const customers = await this.CustomerModel.find(query)
      .populate({path: 'country'}) // if you want to populate country details
      .populate({path: 'billingAddress.city'})
      .populate({path: 'deliveryAddress.city'})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

      if(customers.length == 0) {
        return {
          customers: [],
          count: 0,
        };
      }
      
      const filteredCount = await this.CustomerModel.countDocuments(query)  
        // Convert `createdAt` and `updatedAt` to string format
    const formattedCustomers = customers.map((customer) => {
      const obj = customer.toObject(); // convert Mongoose document to plain object
      return {
        ...obj,
        createdAt: obj.createdAt ? formatDate(obj.createdAt) : null,
        updatedAt: obj.updatedAt ? formatDate(obj.updatedAt) : null,
      };
    });
    
    return {
      customers: formattedCustomers,
      count: filteredCount
    }
    // return formattedCustomers;

    } catch (error) {
      const errorMessage = error?.response?.message || error?.message || 'An unexpected error occurred';
      throw new InternalServerErrorException(`Error: ${errorMessage}`);
    }
    }

    async getCustomersCount(){
      try {
        const totalCount = await this.CustomerModel.countDocuments()
        return totalCount
      } catch (error) {
      const errorMessage = error?.response?.message || error?.message || 'An unexpected error occurred';
      throw new InternalServerErrorException(`Error: ${errorMessage}`);
      }
    }

    async updateCustomer(id: string, body:UpdateCustomerDto){

      if(!isValidObjectId(id)) throw new BadRequestException('Invalid customer ObjectID')

      const {billingAddress, deliveryAddress, country} = body

      if(country){
        if(!isValidObjectId(country)) throw new BadRequestException('Provided Country id is not valid!')
        const resp = await this.CountryModel.findById(country)
        if(!resp) throw new NotFoundException(`No country with this ID: ${country}`)
        }

        if(deliveryAddress?.city){
        if(!isValidObjectId(deliveryAddress?.city)) throw new BadRequestException('Provided delivery City id is not valid!')
        const resp = await this.CityModel.findById(deliveryAddress?.city)
        if(!resp) throw new NotFoundException(`No city with this ID: ${deliveryAddress?.city}`)
        }

        if(billingAddress?.city){
        if(!isValidObjectId(billingAddress?.city)) throw new BadRequestException('Provided billing City id is not valid!')
        const resp = await this.CityModel.findById(billingAddress?.city)
        if(!resp) throw new NotFoundException(`No city with this ID: ${billingAddress?.city}`)
        }

      // Validate that only one usePriceList field is defined
        const priceListFields = ['usePriceList1', 'usePriceList2', 'usePriceList3', 'usePriceList4'];
        
        // Filter only the fields that are explicitly defined (not undefined)
        const definedPriceLists = priceListFields.filter(
          (key) => body[key as keyof typeof body] !== undefined
        );
        
        // Allow either none or exactly one
        if (definedPriceLists.length > 1) {
          throw new BadRequestException(
            `Only one of usePriceList1, usePriceList2, usePriceList3, or usePriceList4 may be provided at a time.`
          );
        }


          // If one price list is defined, set others to false
        // Step 1: Initialize the update query object from the body
        const updateQuery: Partial<UpdateCustomerDto> = { ...body };
        
        // Step 2: If one field is defined, set the others to false
        if (definedPriceLists.length === 1) {
          const trueField = definedPriceLists[0];
        
          for (const key of priceListFields) {
            if (key !== trueField) {
              updateQuery[key as 'usePriceList1' | 'usePriceList2' | 'usePriceList3' | 'usePriceList4'] = false;
            }
          }
        }

        try {
          const updatedCustomer = await this.CustomerModel.findByIdAndUpdate(
            id,
            { $set: updateQuery },
            {
              new: true, // Return updated doc
              runValidators: true, // Ensure schema validation
              context: 'query', // Required for some validators
            }
          ).populate({path: 'country'}) // if you want to populate country details
           .populate({path: 'billingAddress.city'})
           .populate({path: 'deliveryAddress.city'}).exec()

          if (!updatedCustomer) {
            throw new NotFoundException(`No Customer found with ID: ${id}`);
          }
      
          const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');
          const obj = updatedCustomer.toObject(); // convert Mongoose document to plain object
         return {
           ...obj,
           createdAt: obj.createdAt ? formatDate(obj.createdAt) : null,
           updatedAt: obj.updatedAt ? formatDate(obj.updatedAt) : null,
         };
          // return updatedCustomer;
        } catch (error) {
          console.error(error)
        if(
            error.code === 11000
          ) {
            const duplicateField = Object.keys(error.keyValue)[0];
            const duplicateValue = error.keyValue[duplicateField];
            throw new ConflictException(
              `Duplicate entry for ${duplicateField}: ${duplicateValue}`
            );
          }
        const errorMessage = error?.response?.message || error?.message || 'An unexpected error occurred';
        throw new InternalServerErrorException(`Error: ${errorMessage}`);
        }
    }

    async deleteCustomer(id:string){
      if(!isValidObjectId(id)) throw new BadRequestException('Invalid customer ObjectID')
      try {
        const deletedCustomer = await this.CustomerModel.findByIdAndDelete(id).exec();
        if (!deletedCustomer)  throw new NotFoundException('No cutomer found.');
  
        return {
            message: 'Record deleted successfully',
            statusCode: 200
        }
      } catch (error) {
              // Handle other errors
      const errorMessage = error?.response?.message || error?.message || 'An unexpected error occurred';
      throw new InternalServerErrorException(`Error: ${errorMessage}`);
      }

    }


}
