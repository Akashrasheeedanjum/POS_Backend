import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class SaveTemplateDto {
    @ApiProperty({
      description: 'The name of template',
      example: 'Template 1',
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'The name of template',
        example: '<div>templateContent...</div>',
    })
    @IsString()
    templateContent: string
}

export class UpdateTemplateDto extends PartialType(SaveTemplateDto){}