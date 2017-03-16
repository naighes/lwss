const cart = require('../lib/cart.db')
const graphqlModule = require('graphql')
const GraphQLObjectType = graphqlModule.GraphQLObjectType
const GraphQLNonNull = graphqlModule.GraphQLNonNull
const GraphQLSchema = graphqlModule.GraphQLSchema
const GraphQLString = graphqlModule.GraphQLString
const GraphQLInt = graphqlModule.GraphQLInt
const GraphQLFloat = graphqlModule.GraphQLFloat
const GraphQLList = graphqlModule.GraphQLList

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
    name: 'Root',
    fields: () => ({
        cart: {
            type: cartType,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLString)
                }
            },
            resolve: (obj, args, context) => {
                return cart.get(args.id)
            }
        }
    })
})

module.exports.Schema = new GraphQLSchema({
      query: queryType,
      types: [cartType, cartRowType]
})

