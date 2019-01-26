# GraphQL-compose-typescript
[![Build Status](https://travis-ci.org/janexpando/graphql-compose-typescript.svg?branch=master)](https://travis-ci.org/janexpando/graphql-compose-typescript)
[![codecov](https://codecov.io/gh/janexpando/graphql-compose-typescript/branch/master/graph/badge.svg)](https://codecov.io/gh/janexpando/graphql-compose-typescript)
[![npm](https://img.shields.io/npm/dt/graphql-compose-typescript.svg)](http://www.npmtrends.com/graphql-compose-typescript)
Keep in mind, that this module is in early stage of development. 
Feel free to create issue or pr.

## Examples 
```ts
import 'reflect-metadata';
import {graphql} from "graphql";
import {schemaComposer} from "graphql-compose";
import {$field, $resolver, GraphqlComposeTypescript} from "graphql-compose-typescript";

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

    let compose = GraphqlComposeTypescript.create()
    let typeComposer = compose.getComposer(orderService);
    schemaComposer.Query.setField('getOrders', typeComposer.getResolver('getOrders'));
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

```

## Roadmap
 * Create source decorator  
