import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'goals'})
export class Goal {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ name: 'user_id', type: 'uuid', nullable: true})
    userId!: string | null;
    
    @Column({ name: 'attribute_id', type: 'uuid', nullable: true})
    attributeId!: string | null;
}