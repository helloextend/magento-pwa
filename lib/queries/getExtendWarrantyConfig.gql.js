import gql from 'graphql-tag';

export const GET_EXTEND_WARRANTY_CONFIG = gql`
    query getExtendWarrantyConfig {
        storeConfig {
            id
            warranty_enabled
            warranty_store_id
            warranty_cart_offers_enabled
            warranty_environment
            warranty_js_lib_url
        }
    }
`;
