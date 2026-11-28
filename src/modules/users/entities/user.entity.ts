import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity({ name: 'users' })
export class User {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'full_name', type: 'text', nullable: true })
  fullName!: string | null;

  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({
    name: 'password_hash',
    type: 'text',
    nullable: true,
    select: false,
  })
  passwordHash!: string | null;

  @Column({
    name: 'system_role',
    type: 'text',
    nullable: true,
  })
  role!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
