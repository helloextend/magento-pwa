import { isProductConfigurable } from "@magento/peregrine/lib/util/isProductConfigurable";
import { findMatchingVariant } from '@magento/peregrine/lib/util/findMatchingProductVariant';

/**
 * Check if current product is WarrantyProduct
 *
 * @param {Object} product
 * @returns {boolean}
 */
export const isProductExtendWarranty = product => {
    return product && product.__typename === 'WarrantyProduct';
}

/**
 * Built product options array
 *
 * @param {Object} warranty
 * @returns {array}
 */
export const getExtendWarrantyCartOptions = warranty => {
    const options = [];
    if (!warranty)
        return options;

    if (warranty.product) {
        options.push({
            option_label: 'Product',
            value_label: warranty.product
        });
    }
    if (warranty.term) {
        const years = Math.floor(warranty.term / 12);
        const months = warranty.term % 12;
        let termTxt = years + ' year' + (years > 1 ? 's' : '');
        if (months > 0) {
            termTxt += (' ' + months + 'month' + (months > 1 ? 's' : ''));
        }
        options.push({
            option_label: '; Term',
            value_label: termTxt
        });
    }

    return options;
}

/**
 * Get simple product sku for Extend Warranty Offers block
 *
 * @param {Object} product
 * @param {Map|array} selectedOptions
 * @returns {string}
 */
export const getProductSkuForExtendWarranty = (product, selectedOptions = null) => {
    if (!isProductConfigurable(product))
        return product.sku;

    if (!(product.configurable_options || []).length)
        return '';

    const optionCodes = new Map();
    for (const { attribute_id, attribute_code } of product.configurable_options) {
        optionCodes.set(attribute_id, attribute_code);
    }

    let optionSelections = new Map();
    if (selectedOptions instanceof Map) {
        optionSelections = selectedOptions;
    } else {
        (selectedOptions || []).forEach((obj) => {
            optionSelections.set(obj.id.toString(), obj.value_id);
        });
    }

    const variant = findMatchingVariant({
        variants: product.variants || [],
        optionCodes,
        optionSelections
    });

    return variant && variant.product ? variant.product.sku : '';
}
