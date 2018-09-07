const Ajv = require('ajv');
const {
    parse, execute, buildSchema, printSchema,
    GraphQLSchema, GraphQLObjectType, introspectionQuery
  } = require('graphql')

const {INPUT_SUFFIX, newContext, convert} = require('./src/converter')
const assoc = require('lodash/fp/assoc')
const flow  = require('lodash/fp/flow')
const replace  = require('lodash/fp/replace')
const curry  = require('lodash/fp/replace')


exports.convert =  (options={}) => src =>{
    let context = newContext();  // gonna mutate this all the way through!
    return  flow(
      replace(/#\/definitions\//g, ''),
      JSON.parse,
      validateSchema(options),
      processRefs(context),
      makeSchemaForType(context),
    )(src)
}


const processRefs = context => _in =>
{Object.entries(_in.definitions).map(each=>assoc ('id', each[0], each[1]))  
    .forEach(each=>convert(context, each ))
  return _in}

const validateSchema  = options=>schema=>{
    if (options.validate) {
        const ajv = new Ajv({schemaId: 'auto'})
        ajv.addSchema(schema)
      }
      return schema
}

const  makeSchemaForType = context => _in => {
   let {output, input} = convert(context, _in)
    const queryType = new GraphQLObjectType({
      name: 'Query',
      fields: {
        findOne: { type: output }
      }
    });
  
    const mutationType = input ? new GraphQLObjectType({
      name: 'Mutation',
      fields: {
        create: {
          args: {input: {type: input}},
          type: output
        }
      }
    }) : undefined;
    return new GraphQLSchema({query: queryType, mutation: mutationType});
  }

  function pLog (_in) {
    console.log(_in)
    return _in
  }