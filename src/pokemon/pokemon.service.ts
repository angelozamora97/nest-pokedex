import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleError(error);
    }
  }

  findAll() {
    const pokemonList = this.pokemonModel.find();
    return pokemonList;
  }

  async findOne(term: string) {
    let pokemon = null;
    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: +term });
    } else if (isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    } else {
      pokemon = await this.pokemonModel.findOne({ name: term });
    }

    if (!pokemon) {
      throw new NotFoundException(
        `Pokemon with id, name or no ${term} not found en DB`,
      );
    }
    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);

    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    }

    try {
      await pokemon.updateOne(updatePokemonDto, { new: true });

      return { ...pokemon.toJSON(), ...updatePokemonDto };
    } catch (error) {
      this.handleError(error);
    }
  }

  async remove(_id: string) {
    const { deletedCount } = await this.pokemonModel.deleteMany({ _id });
    if (deletedCount <= 0) {
      throw new NotFoundException(`Pokemon with id ${_id} not found`);
    }

    return;
  }

  private handleError(error: any) {
    if (error.code == 11000) {
      throw new BadRequestException(
        `Pokemon exist in BD ${JSON.stringify(error.keyValue)}`,
      );
    }
    console.log(error);
    throw new InternalServerErrorException(
      "Can't create Pokemon - Check server logs",
    );
  }
}
