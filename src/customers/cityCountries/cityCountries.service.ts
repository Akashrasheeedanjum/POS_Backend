import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Country } from '../Schemas/Country.schema';
import { isValidObjectId, Model } from 'mongoose';
import { CreateCountryDto, UpdateCountryDto } from '../dtos/CreateCountry.dto';
import { CreateCityDto, UpdateCityDto } from '../dtos/CreateCity.dto';
import { City } from '../Schemas/City.schema';

import { Schema as MongooseSchema } from 'mongoose';

@Injectable()
export class CityCountriesService {
    constructor(
        @InjectModel(Country.name)
        private readonly CountryModel: Model<Country>,
        @InjectModel(City.name)
        private readonly CityModel: Model<City>,
    ){}
    

    async createCountry(body: CreateCountryDto){
        const {countryCode, countryName} = body;

        const trimmedName = countryName.trim();
        const normalizedCode = countryCode ? countryCode.trim().toLowerCase() : '';

        try {
          // if country exist with similar name then return that otherwise create a new country
          const country = await this.CountryModel.findOneAndUpdate(
          { countryName: trimmedName }, // Search condition
          {
            $setOnInsert: {
              countryName: trimmedName,
              countryCode: normalizedCode,
            },
          },
          {
            new: true,       // Return the document after update/insert
            upsert: true,    // Create new if not found
          }
          );
            
            return country
        } catch (error) {

            if (
                error.code === 11000 &&  // Mongoose duplicate key error code
                error.keyPattern?.countryName
              ) {
                throw new ConflictException(`Country name '${countryName}' already exists.`);
              }
                    // Handle other errors
                const errorMessage = error?.response?.message || error?.message || 'An unexpected error occurred';
                throw new InternalServerErrorException(`Failed to create country: ${errorMessage}`);
        }

        
    }


    async getAllCountries(){
        try {
        const list = await this.CountryModel.find()
        .sort({countryName: 1})
        .select('-__v')
        .exec()
        if(list.length === 0) {
          return [];
        }

        return list
        } catch (error) {
        // Handle other errors
        const errorMessage = error?.response?.message || error?.message || 'An unexpected error occurred';
        throw new InternalServerErrorException(`Failed to find any country: ${errorMessage}`);
        }
    }

    async updateCountry(id: string, body: UpdateCountryDto) {
        if (!isValidObjectId(id)) {
          throw new BadRequestException('Invalid Country ID');
        }
      
        const { countryName, countryCode } = body;
      
        try {
          const updatedCountry = await this.CountryModel.findByIdAndUpdate(
            id,
            {
              countryName: countryName?.trim(),
              countryCode: countryCode?.trim().toLowerCase(),
            },
            {
              new: true, // Return updated doc
              runValidators: true, // Ensure schema validation
              context: 'query', // Required for some validators
            }
          ).exec();
      
          if (!updatedCountry) {
            throw new NotFoundException(`No country found with ID: ${id}`);
          }
      
          return updatedCountry;
        } catch (error) {
          // Handle duplicate key error (e.g., unique constraint on countryName or countryCode)
          if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0];
            throw new ConflictException(`${duplicateField} already exists.`);
          }
      
          console.error('Update Country Error:', error);
          throw new InternalServerErrorException('An error occurred while updating the country.');
        }
      }

    async deleteCountry(id:string){
        if(!isValidObjectId(id)) throw new BadRequestException('Invalid Country ID');
        try {
        const deletedCountry = await this.CountryModel.findByIdAndDelete(id).exec();
        if (!deletedCountry)  throw new NotFoundException('No country found.');

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


    // cities service routes
    async createCity(body: CreateCityDto) {
  const { cityName, countryId } = body;

  // Validate countryId if provided
  if (countryId && !isValidObjectId(countryId)) {
    throw new BadRequestException('Provided countryId is not valid');
  }

  try {
    const trimmedCityName = cityName.trim();

    let validCountryId: MongooseSchema.Types.ObjectId | undefined | string = undefined;
    if (countryId) {
      const country = await this.CountryModel.findById(countryId);
      if (!country) {
        throw new NotFoundException('No country with this id');
      }
      validCountryId = countryId;
    }

    // Atomic operation: Find or insert
    const city = await this.CityModel.findOneAndUpdate(
      { cityName: trimmedCityName }, // Search condition
      {
        $setOnInsert: {
          cityName: trimmedCityName,
          ...(validCountryId && { countryId: validCountryId }),
        },
      },
      {
        new: true, // return the new doc if inserted, or existing if found
        upsert: true, // create if not exists
      }
    );

    return city;

  } catch (error) {
    if (
      error.code === 11000 && error.keyPattern?.cityName
    ) {
      throw new ConflictException(`City name '${cityName}' already exists.`);
    }

    const errorMessage = error?.response?.message || error?.message || 'An unexpected error occurred';
    throw new InternalServerErrorException(`Failed to create or find city: ${errorMessage}`);
  }
}


    async getAllCities(){
      try {
        const list = await this.CityModel.find()
        .populate({path: 'countryId', select: '-__v'})
        .sort({cityName: 1})
        .select('-__v')
        .exec()
        if(list.length === 0) {
          return [];
        }

        return list
        } catch (error) {
        // Handle other errors
        const errorMessage = error?.response?.message || error?.message || 'An unexpected error occurred';
        throw new InternalServerErrorException(`Failed to find cities: ${errorMessage}`);
        }
    }

    async getCity(id:string){
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid provided city ID');
      }

      try {
        const foundCity = await this.CityModel.findById(id).exec();
    
        if (!foundCity) {
          throw new NotFoundException(`No City found with ID: ${id}`);
        }
    
        return foundCity;
      } catch (error) {
        console.error('Getting City Error:', error);
        throw new InternalServerErrorException(`Error. ${error?.message}`);
      }
    }

    async getCountry(id:string){
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid provided country ID');
      }

      try {
        const foundCountry = await this.CountryModel.findById(id).exec();
    
        if (!foundCountry) {
          throw new NotFoundException(`No country found with ID: ${id}`);
        }
    
        return foundCountry;
      } catch (error) {
        console.error('Country getting Error:', error);
        throw new InternalServerErrorException(`Error. ${error?.message}`);
      }
    }

    async updateCity(id:string, body:UpdateCityDto){
      const { cityName, countryId } = body;
      if (!isValidObjectId(id) || countryId?!isValidObjectId(countryId): false) {
        throw new BadRequestException('Invalid provided ID or IDs');
      }
    
      if(countryId){
        const country = await this.CountryModel.findById({_id: countryId})
        if(!country) throw new NotFoundException('No country with this id')
      }

      try {
        const updatedCity = await this.CityModel.findByIdAndUpdate(
          id,
          {
            cityName: cityName?.trim(),
            countryId,
          },
          {
            new: true, // Return updated doc
            runValidators: true, // Ensure schema validation
            context: 'query', // Required for some validators
          }
        ).exec();
    
        if (!updatedCity) {
          throw new NotFoundException(`No City found with ID: ${id}`);
        }
    
        return updatedCity;
      } catch (error) {
        // Handle duplicate key error (e.g., unique constraint on countryName or countryCode)
        if (error.code === 11000) {
          const duplicateField = Object.keys(error.keyPattern || {})[0];
          throw new ConflictException(`${duplicateField} already exists.`);
        }
    
        console.error('Update City Error:', error);
        throw new InternalServerErrorException(`Error. ${error?.message}`);
      }
    }

    async deleteCity(id:string){
      if(!isValidObjectId(id)) throw new BadRequestException('Invalid City ID');
      try {
      const deletedCity = await this.CityModel.findByIdAndDelete(id).exec();
      if (!deletedCity)  throw new NotFoundException('No City found.');

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
