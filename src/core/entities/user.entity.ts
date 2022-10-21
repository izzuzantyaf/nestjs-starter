import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  isEmail,
  isEmpty,
  isNotEmptyObject,
  isObject,
  maxLength,
  minLength,
} from 'class-validator';
import { ApiHideProperty } from '@nestjs/swagger';

export type UserDocument = User & Document;

export type UserConstructorProps = Pick<
  User,
  '_id' | 'name' | 'email' | 'password'
>;

@Schema({ timestamps: true })
export class User {
  _id?: string;
  @Prop({ required: true })
  name: string;
  @Exclude()
  @Prop({ required: true, unique: true })
  email: string;
  @ApiHideProperty()
  @Prop({ required: true })
  password: string;

  constructor(props?: UserConstructorProps) {
    const { _id, name, email, password } = props;
    this._id = _id;
    this.name = name;
    this.email = email;
    this.password = password;
  }

  protected validateName() {
    const maxNameLength = 100;
    if (isEmpty(this.name)) return { name: 'Nama harus diisi' };
    if (!maxLength(this.name, maxNameLength))
      return { name: `Nama maksimal ${maxNameLength} karakter` };
    return true;
  }

  protected validateEmail() {
    if (isEmpty(this.email)) return { email: 'Email harus diisi' };
    if (!isEmail(this.email)) return { email: 'Email tidak valid' };
    return true;
  }

  protected validatePassword() {
    const minPasswordLength = 6;
    if (isEmpty(this.password)) return { password: 'Password harus diisi' };
    if (!minLength(this.password, minPasswordLength))
      return { password: `Password minimal ${minPasswordLength} karakter` };
    return true;
  }

  validateProps() {
    const validationResults = [
      this.validateName(),
      this.validateEmail(),
      this.validatePassword(),
    ];
    const errors = validationResults.reduce(
      (error, result) => (isObject(result) ? { ...error, ...result } : error),
      {},
    );
    if (isNotEmptyObject(errors)) {
      console.error('Validation errors :', errors);
      return errors;
    } else return null;
  }

  async hashPassword() {
    const saltOrRounds = 10;
    this.password = await bcrypt.hash(this.password, saltOrRounds);
    return this.password;
  }

  async verifyPassword(passwordToBeVerified: string) {
    return await bcrypt.compare(passwordToBeVerified, this.password);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);