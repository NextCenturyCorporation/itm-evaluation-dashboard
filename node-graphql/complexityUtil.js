const { GraphQLObjectType } = require('graphql');
const { getComplexity, simpleEstimator } = require('graphql-query-complexity');
const { separateOperations } = require('graphql');

// maximum total complexity of any query
const MAX_COMPLEXITY = 1000;

// grab all of the complexities from server schema
function extractComplexityValues(schema) {
    const complexityMap = {};
    
    const typeMap = schema.getTypeMap();
    
    Object.values(typeMap).forEach(type => {
        if (type instanceof GraphQLObjectType) {
            const fields = type.getFields();
            
            Object.values(fields).forEach(field => {
                const astNode = field.astNode;
                if (astNode && astNode.directives) {
                    const complexityDirective = astNode.directives.find(
                        directive => directive.name.value === 'complexity'
                    );
                    
                    if (complexityDirective) {
                        const valueArg = complexityDirective.arguments.find(
                            arg => arg.name.value === 'value'
                        );
                        
                        if (valueArg && valueArg.value.kind === 'IntValue') {
                            const complexity = parseInt(valueArg.value.value, 10);
                            complexityMap[field.name.toLowerCase()] = complexity;
                            
                            if (!field.extensions) field.extensions = {};
                            field.extensions.complexity = complexity;
                        }
                    }
                }
            });
        }
    });
    
    return complexityMap;
}

function customEstimator(complexityMap) {
    return (options) => {
        if (complexityMap[options.fieldName?.toLowerCase()]) {
            return complexityMap[options.fieldName.toLowerCase()];
        }
        
        if (complexityMap[options.node?.name?.value?.toLowerCase()]) {
            return complexityMap[options.node.name.value.toLowerCase()];
        }
        
        // will use default
        return undefined;
    };
}

function processQueryComplexity(schema, complexityMap, request, document) {
    if (!document) return null;
    
    try {
        const operationName = request.operationName;
        
        const estimator = customEstimator(complexityMap);
        
        const queryComplexity = getComplexity({
            schema,
            query: request.operationName
                ? separateOperations(document)[request.operationName]
                : document,
            variables: request.variables,
            estimators: [
                estimator,
                simpleEstimator({ defaultComplexity: 1 }),
            ],
        });
        
        console.log(`Operation "${operationName}" has complexity: ${queryComplexity}`);
        
        if (queryComplexity > MAX_COMPLEXITY) {
            console.error(`Operation "${operationName}" blocked: complexity of ${queryComplexity} exceeds threshold: ${MAX_COMPLEXITY}`);
            throw new Error(
                `Query complexity of ${queryComplexity} exceeds maximum allowed complexity of ${MAX_COMPLEXITY}`
            );
        }
        
        return queryComplexity;
    } catch (error) {
        if (error.message.includes("Query complexity")) {
            throw error;
        }
        // non complexity err
        console.error(error);
        return null;
    }
}

module.exports = {
    MAX_COMPLEXITY,
    extractComplexityValues,
    customEstimator,
    processQueryComplexity
};