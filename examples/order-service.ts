import 'reflect-metadata';
import {graphql} from "graphql";
import {schemaComposer} from "graphql-compose";
import {$field, $resolver, GraphqlComposeTypescript} from "../src";

class Order {
    @$field() id: string;
    @$field() quantity: number;

    constructor(id: string, quantity: number){
        this.id = id;
        this.quantity = quantity;
    }
}

class OrderService {
    @$resolver(()=> Order)
    getOrders(): Order[]{
        return [new Order('a', 1), new Order('b',2)];
    }
}

async function main(){
    let orderService = new OrderService();

    let compose = GraphqlComposeTypescript.create();
    schemaComposer.Query.setField('getOrders', compose.getResolver(orderService,'getOrders'));
    let schema = schemaComposer.buildSchema();
    let result = await graphql(schema, `{
        getOrders{
            id
            quantity
        }
    }`);
    console.log(JSON.stringify(result.data.getOrders));
    /**
     * [{"id":"a","quantity":1},{"id":"b","quantity":2}]
     */
}
main();
