import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useExtendWarranty } from "../context/extendWarranty";
import { useExtendWarrantyOffers } from "../talons/useExtendWarrantyOffers";
import LoadingIndicator from "@magento/venia-ui/lib/components/LoadingIndicator";

const ExtendWarrantyOffers = (props) => {
    const {
        blockId,
        blockPrefix,
        productSku,
        isSimpleOffer,
        addToCartCallback
    } = props;

    const componentMounted = useRef(true);
    const blockRef = useRef();

    const talonProps = useExtendWarrantyOffers({
        blockId,
        blockPrefix
    });
    const {
        warrantyBlockId,
        warrantyLoading,
        initWarrantyOffersBlock,
        destroyWarrantyOffersBlock
    } = talonProps;

    const contextProps = useExtendWarranty();
    const pluginReady = contextProps ? contextProps.pluginReady : false;

    useEffect(() => {
        return () => {
            componentMounted.current = false;
            blockRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (componentMounted.current && pluginReady && blockRef.current) {
            initWarrantyOffersBlock(productSku, isSimpleOffer, addToCartCallback);
        }

        return () => {
            if (pluginReady) {
                destroyWarrantyOffersBlock();
            }
        }
    }, [ componentMounted, pluginReady, blockRef, productSku, isSimpleOffer, addToCartCallback, initWarrantyOffersBlock, destroyWarrantyOffersBlock ] );

    return pluginReady && warrantyBlockId ?
        (<>
            {warrantyLoading ? <LoadingIndicator global={true}>{'Processing...'}</LoadingIndicator> : null}
            <div id={warrantyBlockId} ref={blockRef}></div>
        </>) :
        null;
};

ExtendWarrantyOffers.propTypes = {
    blockId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]).isRequired,
    blockPrefix: PropTypes.string,
    productSku: PropTypes.string,
    isSimpleOffer: PropTypes.bool,
    addToCartCallback: PropTypes.func
}

export default ExtendWarrantyOffers;
