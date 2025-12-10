import { Entity, PrimaryGeneratedColumn, Column, ManyToOne,CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string; 

  @Column()
  name: string; 

  @Column('simple-array')
  permissions: string[]; 

  @Column()
  expires_at: Date;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.apiKeys)
  user: User;
}