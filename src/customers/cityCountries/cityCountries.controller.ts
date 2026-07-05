import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CityCountriesService } from './cityCountries.service';
import { CreateCountryDto, UpdateCountryDto } from '../dtos/CreateCountry.dto';
import { CreateCityDto, UpdateCityDto } from '../dtos/CreateCity.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('cityCountries')
@Controller('cityCountries')
export class CityCountriesController {
  constructor(private readonly cityCountriesService: CityCountriesService) {}

  //Countries routes

  @Post('createCountry')
  @ApiOperation({ summary: 'Create a new Country' })
  @ApiResponse({ status: 201, description: 'Country created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  createCountry(
    @Body() body: CreateCountryDto
  ){
    return this.cityCountriesService.createCountry(body)
  }

  @Get('countriesList')
  @ApiOperation({ summary: 'Get all countriesList' })
  @ApiResponse({ status: 200, description: 'List of all countriesList.' })
  getAllCountry(){
    return this.cityCountriesService.getAllCountries()
  }

  @Put('updateCountry/:id')
  @ApiOperation({ summary: 'Update a country by providing an ID' })
  @ApiParam({ name: 'id', description: 'country ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'country updated' })
  @ApiResponse({ status: 404, description: 'country not found.' })
  updateCountry(
    @Body() body: UpdateCountryDto,
    @Param('id') id: string
  ){
    return this.cityCountriesService.updateCountry(id, body)
  }

  @Delete('deleteCountry/:id')
  @ApiOperation({ summary: 'Delete country by ID' })
  @ApiParam({ name: 'id', description: 'country ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Record deleted successfully.' })
  async deleteCountry(
    @Param('id') id: string,
  ){
    return this.cityCountriesService.deleteCountry(id)
    
  }



  // cities route
  @Post('createCity')
  @ApiOperation({ summary: 'Create a new city' })
  @ApiResponse({ status: 201, description: 'city created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  createCity(
    @Body() body: CreateCityDto
  ){
    return this.cityCountriesService.createCity(body)
  }

  @Get('citiesList')
  @ApiOperation({ summary: 'Get all Cities' })
  @ApiResponse({ status: 200, description: 'List of all Cities.' })
  getAllCities(){
    return this.cityCountriesService.getAllCities()
  }

  @Get('getCity/:id')
  @ApiOperation({ summary: 'Get a City' })
  @ApiResponse({ status: 200, description: 'Get a City' })
  getCity(
    @Param('id') id: string
  ){
    return this.cityCountriesService.getCity(id)
  }


  @Get('getCountry/:id')
  @ApiOperation({ summary: 'Get a Country' })
  @ApiResponse({ status: 200, description: 'Get a Country' })
  getCountry(
    @Param('id') id: string
  ){
    return this.cityCountriesService.getCountry(id)
  }


  @Put('updateCity/:id')
  @ApiOperation({ summary: 'Update a city by providing an ID' })
  @ApiParam({ name: 'id', description: 'city ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'city updated' })
  @ApiResponse({ status: 404, description: 'city not found.' })
  updateCity(
    @Body() body: UpdateCityDto,
    @Param('id') id: string
  ){
    return this.cityCountriesService.updateCity(id, body)
  }

  @Delete('deleteCity/:id')
  @ApiOperation({ summary: 'Delete city by ID' })
  @ApiParam({ name: 'id', description: 'city ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Record deleted successfully.' })
  async deleteCity(
    @Param('id') id: string,
  ){
    return this.cityCountriesService.deleteCity(id)
  }
}
