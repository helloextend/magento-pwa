import gql from 'graphql-tag';

export const ADD_EXTEND_WARRANTY_TO_CART = gql`
    mutation addWarrantyToCart($cartId: String!, $warranty: WarrantyPlanCartItem!, $qty: Int, $option:String) {
        addWarrantyToCart(
            input: {
                cart_id: $cartId
                warranty: $warranty,
                qty: $qty,
                option: $option
            }
        ) {
            cart {
                id
                items {
                    id
                    product {
                        id
                        name
                    }
                    quantity
                }
            }
        }
    }
`;
