import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/react-hooks';
import { useAwaitQuery } from "@magento/peregrine/lib/hooks/useAwaitQuery";
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useStoreSwitcherContext } from "@magento/peregrine/lib/context/storeSwitcher";

import { ADD_EXTEND_WARRANTY_TO_CART } from '../queries/addExtendWarrantyToCart.gql';
import CREATE_CART_MUTATION from "@magento/venia-ui/lib/queries/createCart.graphql";
import GET_CART_DETAILS from "@magento/venia-ui/lib/queries/getCartDetails.graphql";

const WARRANTY_BLOCK_PREFIX = 'extend-offer-';

/**
 * Create a basic object representing a content type in our tree
 *
 * @param {object} props
 * @param {string} props.blockId - unique ID for Extend Warranty Offers block
 * @param {string} props.blockPrefix - optional parameter for custom Extend Warranty Offers block prefix
 * @returns {{
 *  warrantyBlockId: string,
 *  loading: boolean,
 *  initWarrantyButton: (function(*=, *=): void),
 *  updateWarrantyButton: (function(*=): void),
 *  destroyWarrantyButton: (function(): void),
 *  handleAddWarrantyToCart: (function(*=, *=): Promise<boolean>),
 *  openWarrantyPlansModal: (function(*=): void),
 *  getWarrantyPlanSelection: (function(): (null|object))
 * }}
 */
export const useExtendWarrantyOffers = props => {
    const {
        blockId,
        blockPrefix
    } = props;

    const warrantyBlockId = (blockPrefix || WARRANTY_BLOCK_PREFIX) + blockId;
    const [{ activeStoreCode }] = useStoreSwitcherContext();
    const [{ details: { id: cartId } }, { getCartDetails }] = useCartContext();

    const [fetchCartId] = useMutation(CREATE_CART_MUTATION);
    const fetchCartDetails = useAwaitQuery(GET_CART_DETAILS);
    const [
        addWarrantyToCartMutation,
        {
            called: addWarrantyCalled,
            error: addWarrantyError,
            loading: addingWarranty
        }
    ] = useMutation(ADD_EXTEND_WARRANTY_TO_CART);
    const [loading, setLoading] = useState(!addWarrantyError && (addingWarranty || addWarrantyCalled));


    const checkExtendWarrantyInited = useCallback(() => {
        return typeof Extend !== 'undefined' && typeof Extend.buttons !== 'undefined';
    }, []);

    const getWarrantyOffersBlockInstance = useCallback(
        () => {
            if (!checkExtendWarrantyInited())
                return null;

            return Extend.buttons.instance('#' + warrantyBlockId);
        },
        [checkExtendWarrantyInited, warrantyBlockId]);

    const getWarrantyOffersSelection = useCallback(
        () => {
            const component = getWarrantyOffersBlockInstance();
            if (!component || !component.getPlanSelection() || !component.getActiveProduct())
                return null;

            const plan = component.getPlanSelection();
            plan.product = component.getActiveProduct().id;
            return plan;
        },
        [getWarrantyOffersBlockInstance]);

    const openWarrantyOffersModal = useCallback(
        (callback = null) => {
            const component = getWarrantyOffersBlockInstance();
            if (component && component.getActiveProduct()) {
                const sku = component.getActiveProduct().id;

                Extend.modal.open({
                    referenceId: sku,
                    onClose: function (plan) {
                        if (callback) {
                            if (plan) {
                                plan.product = sku;
                            }
                            callback(plan);
                        }
                    }
                });
            } else if (callback) {
                callback(null);
            }
        },
        [getWarrantyOffersBlockInstance]);

    const handleAddWarrantyToCart = useCallback(
        async (warranty, qty = null, option = null) => {
            if (!warranty || !warranty.planId || !warranty.product) {
                console.error('Not enough data to add Protection Plan', warranty);
                return false;
            }

            try {
                const payload = {
                    cartId,
                    warranty,
                    qty,
                    option
                };

                setLoading(true);
                await addWarrantyToCartMutation({
                    variables: payload,
                    context: {
                        headers: {
                            "Store": activeStoreCode
                        }
                    }
                });
                await getCartDetails({
                    fetchCartId,
                    fetchCartDetails
                });
                setLoading(false);
                return true;
            } catch (err) {
                console.error(err);
                setLoading(false);
                return false;
            }
        },
        [cartId, activeStoreCode, addWarrantyToCartMutation, getCartDetails, fetchCartDetails, fetchCartId, setLoading]
    );

    const initWarrantyOffersBlock = useCallback(
        (productSku = null, simpleOffer = false, addToCartCallback = null) => {
            if (!checkExtendWarrantyInited())
                return;

            const component = getWarrantyOffersBlockInstance();

            if (component) {
                component.setActiveProduct(productSku);
            } else {
                if (simpleOffer) {
                    Extend.buttons.renderSimpleOffer('#' + warrantyBlockId, {
                        referenceId: productSku,
                        onAddToCart: (data) => {
                            const plan = (data || {}).plan;

                            if (plan) {
                                plan.product = (data.product || {}).id;
                                handleAddWarrantyToCart(plan).then((res) => {
                                    if (addToCartCallback) {
                                        addToCartCallback(res);
                                    }
                                });
                            }
                        }
                    });
                } else {
                    Extend.buttons.render('#' + warrantyBlockId, {
                        referenceId: productSku
                    });
                }
            }
        },
        [checkExtendWarrantyInited, warrantyBlockId, getWarrantyOffersBlockInstance, handleAddWarrantyToCart]);

    const updateWarrantyOffersBlock = useCallback(
        (newProductSku) => {
            const component = getWarrantyOffersBlockInstance();

            if (component && (component.getActiveProduct() || {}).id !== newProductSku) {
                component.setActiveProduct(newProductSku);
            }
        },
        [getWarrantyOffersBlockInstance]);

    const destroyWarrantyOffersBlock = useCallback(
        () => {
            const component = getWarrantyOffersBlockInstance();
            if (component) {
                component.destroy();
            }
        },
        [getWarrantyOffersBlockInstance]);

    return {
        warrantyBlockId: warrantyBlockId,
        warrantyLoading: loading,
        initWarrantyOffersBlock,
        updateWarrantyOffersBlock,
        destroyWarrantyOffersBlock,
        getWarrantyOffersSelection,
        openWarrantyOffersModal,
        handleAddWarrantyToCart
    };
}
