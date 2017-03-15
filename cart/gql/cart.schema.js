const cart = require('../../lib/cart.db')
const {
    GraphQLObjectType,
    GraphQLNonNull,
    GraphQLSchema,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLList
} = require('graphql')

const cartRowType = new GraphQLObjectType({
    name: 'CartRow',
    fields: () => ({
        id: {
            type: new GraphQLNonNull(GraphQLString)
        },
        description: {
            type: GraphQLString
        },
        price: {
            type: GraphQLFloat
        },
        quantity: {
            type: GraphQLInt
        },
        thumb_url: {
            type: GraphQLString
        }
    })
})

const cartType = new GraphQLObjectType({
    name: 'Cart',
    fields: () => ({
        id: {
            type: new GraphQLNonNull(GraphQLString)
        },
        rows: {
            type: new GraphQLList(cartRowType)
        }
    })
})

const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
        cart: {
            type: cartType,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLString)
                }
            },
            resolve: (root, args, ast) => {
                return cart.get(args.id)
            }
        }
    })
})

module.exports.CartSchema = new GraphQLSchema({
      query: queryType,
      types: [cartType, cartRowType]
})

