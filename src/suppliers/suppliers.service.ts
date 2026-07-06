import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Supplier } from './Schemas/Supplier.schema';
import { isValidObjectId, Model } from 'mongoose';
import { CreateSupplierDto, UpdateSupplierDto } from './dtos/CreateSupplier.dto';
import { v4 as uuidv4 } from 'uuid';
import { City } from '../customers/Schemas/City.schema';
import { format } from 'date-fns';

@Injectable()
export class SuppliersService {
    constructor(
    @InjectModel(Supplier.name)
    private readonly SupplierModel: Model<Supplier>,
    @InjectModel(City.name)
    private readonly CityModel: Model<City>
    ){}


    async createSupplier(body: CreateSupplierDto){
        const {city, numberProvided} = body
       const suppCode = Array.from(crypto.getRandomValues(new Uint8Array(8)))
       .map((n) => (n % 10).toString())
       .join('');

        if(city){
        if(!isValidObjectId(city)) throw new BadRequestException('Provided City Id is not valid!')
        const resp = await this.CityModel.findById(city)
        if(!resp) throw new NotFoundException(`No City with this ID: ${city}`)
        }

  
        try {
        // const supplier = await this.SupplierModel.create({
        //     ...body,
        //     numberProvided: numberProvided ?? suppCode 
        // })

        const supplier = new this.SupplierModel({
          ...body,
          numberProvided: numberProvided ?? suppCode
        });

        await supplier.save();
        await supplier.populate('city');

        const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');
          const obj = supplier.toObject(); // convert Mongoose document to plain object
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


    async getAllSuppliers(filter:any, page, pageSize){
    // for pagination of 10 records per page
    try {
    // const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const query: any = {};

    const regexFields = [
        'numberProvided',
        'nameDenomination',
        'zipCode'
    ];
    for (const key in filter) {
        if (!filter[key]) continue;
        if (regexFields.includes(key)) {
        query[key] = { $regex: filter[key], $options: 'i' }; //{ nameDenomination: { $regex: 'john', $options: 'i' } }  This allows you to match "John", "JOHN", "jo" — anything that contains "john" in any case.
        } else {
        query[key] = filter[key]; //If the field isn't in regexFields, use an exact match. exact match for things like `city` because we use objectID for city field's value
        }
    }
    const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');
    
    const suppliers = await this.SupplierModel.find(query)
    .populate({path: 'city'}) // if you want to populate city details
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize)
    .exec();
    if(suppliers.length === 0) throw new NotFoundException('No supplier found')
        
    const filteredCount = await this.SupplierModel.countDocuments(query)   

                // Convert `createdAt` and `updatedAt` to string format
    const formattedSuppliers = suppliers.map((supplier) => {
    const obj = supplier.toObject(); // convert Mongoose document to plain object
    return {
        ...obj,
        createdAt: obj.createdAt ? formatDate(obj.createdAt) : null,
        updatedAt: obj.updatedAt ? formatDate(obj.updatedAt) : null,
    };
    });
    
    return {
      suppliers: formattedSuppliers,
      count: filteredCount
    };

        } catch (error) {
        const errorMessage = error?.response?.message || error?.message || 'An unexpected error occurred';
        throw new InternalServerErrorException(`Error: ${errorMessage}`);
        }
        }


    async allSuppliers(){
    try {

    const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');
    
    const suppliers = await this.SupplierModel.find()
    .populate({path: 'city'}) // if you want to populate city details
    .sort({ nameDenomination: 1 })
    .exec();
    if(suppliers.length === 0) throw new NotFoundException('No supplier found')
                // Convert `createdAt` and `updatedAt` to string format
    const formattedSuppliers = suppliers.map((supplier) => {
    const obj = supplier.toObject(); // convert Mongoose document to plain object
    return {
        ...obj,
        createdAt: obj.createdAt ? formatDate(obj.createdAt) : null,
        updatedAt: obj.updatedAt ? formatDate(obj.updatedAt) : null,
    };
    });
    
    return {
      suppliers: formattedSuppliers
    };

        } catch (error) {
        const errorMessage = error?.response?.message || error?.message || 'An unexpected error occurred';
        throw new InternalServerErrorException(`Error: ${errorMessage}`);
        }
      }

    async getSuppliersCount(){
      try {
        const totalCount = await this.SupplierModel.countDocuments()
        return totalCount
      } catch (error) {
      const errorMessage = error?.response?.message || error?.message || 'An unexpected error occurred';
      throw new InternalServerErrorException(`Error: ${errorMessage}`);
      }
    }

    async updateSupplier(id: string, body:UpdateSupplierDto){

      if(!isValidObjectId(id)) throw new BadRequestException('Invalid City ObjectID')

      const {city} = body

      if(city){
        if(!isValidObjectId(city)) throw new BadRequestException('Provided City id is not valid!')
        const resp = await this.CityModel.findById(city)
        if(!resp) throw new NotFoundException(`No city with this ID: ${city}`)
        }
        const updateQuery: Partial<UpdateSupplierDto> = { ...body };
        // delete updateQuery.numberProvided;
        if(updateQuery.numberProvided) throw new UnauthorizedException('You cannot change Number provided field value.')
        
        try {
          const updatedSupplier = await this.SupplierModel.findByIdAndUpdate(
            id,
            { $set: updateQuery },
            {
              new: true, // Return updated doc
              runValidators: true, // Ensure schema validation
              context: 'query', // Required for some validators
            }
          ).populate('city').exec();

          if (!updatedSupplier) {
            throw new NotFoundException(`No Supplier found with ID: ${id}`);
          }
      
          const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');
          const obj = updatedSupplier.toObject(); // convert Mongoose document to plain object
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

    async deleteSupplier(id:string){
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid Supplier ObjectID')
    try {
      const deletedSupplier = await this.SupplierModel.findByIdAndDelete(id).exec();
      if (!deletedSupplier)  throw new NotFoundException('No Supplier found.');

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
