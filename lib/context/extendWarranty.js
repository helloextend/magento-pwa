import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLazyQuery } from "@apollo/react-hooks";
import { useStoreSwitcherContext } from "@magento/peregrine/lib/context/storeSwitcher";
import { storage } from "@magento/venia-ui/lib/drivers/adapter";

const ExtendWarrantyContext = createContext();

const EXTEND_WARRANTY_SCRIPT_ID = 'extend_warranty_script';
const EXTEND_WARRANTY_STORAGE_KEY = 'extend_warranty_config';

const loadExtendWarrantyPlugin = (config, isCartPage, callback, scriptId = EXTEND_WARRANTY_SCRIPT_ID) => {
    if (!config || !config.warranty_enabled || !config.warranty_js_lib_url)
        return;

    if (isCartPage && !config.warranty_cart_offers_enabled)
        return;

    const script = document.getElementById(scriptId);
    if (!script) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = config.warranty_js_lib_url;
        script.async = true;
        script.onload = () => {
            setExtendWarrantyPluginConfig(config);
            callback();
        };

        document.body.appendChild(script);
    } else if (script.getAttribute('src') === config.warranty_js_lib_url) {
        callback();
    }
};

const unloadExtendWarrantyPlugin = (scriptId = EXTEND_WARRANTY_SCRIPT_ID) => {
    const script = document.getElementById(scriptId);
    if (script) {
        document.body.removeChild(script);
    }
};

const setExtendWarrantyPluginConfig = (config) => {
    Extend.config({
        storeId: config.warranty_store_id,
        environment: config.warranty_environment
    });
}

/**
 * This component contains a hook that checks ExtendWarranty module config and loads external js-plugin.
 * Use this component with {@link useExtendWarranty} to check ExtendWarranty module is ready for use.
 *
 * It is recommended to only create/use a single time at the top level of your app
 * @summary A React context provider.
 *
 * @kind function
 *
 * @param {Object} props - React component props
 *
 * @return {Context.Provider} A [React context provider]{@link https://reactjs.org/docs/context.html}
 *
 */
export const ExtendWarrantyContextProvider = props => {
    const {
        pluginLoaded,
        isCartPage,
        fetchConfigQuery
    } = props;

    const [pluginReady, setPluginReady] = useState(pluginLoaded || false);
    const [moduleConfig, setModuleConfig] = useState(null);

    const [{ activeStoreCode }] = useStoreSwitcherContext();
    const [loadConfig, { data: config }] = useLazyQuery(fetchConfigQuery, {
        fetchPolicy: "no-cache",
        errorPolicy: "all",
        context: {
            headers: {
                "Store": activeStoreCode
            }
        }
    });

    useEffect(() => {
        return () => {
            storage.removeItem(EXTEND_WARRANTY_STORAGE_KEY);
            setPluginReady(false);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (pluginReady) {
                unloadExtendWarrantyPlugin();
                setPluginReady(false);
            }
        }
    }, [pluginReady]);


    useEffect(() => {
        if (pluginReady)
            return;

        const localConfig = storage.getItem(EXTEND_WARRANTY_STORAGE_KEY);

        if (localConfig && localConfig.storeCode === activeStoreCode) {
            setModuleConfig(localConfig)
        } else {
            loadConfig();
        }
    }, [pluginReady, activeStoreCode, loadConfig]);

    useEffect(()=> {
        if (pluginReady)
            return;

        if (config && config.storeConfig) {
            const moduleConf = Object.assign({}, config.storeConfig, { storeCode: activeStoreCode });
            setModuleConfig(moduleConf);
            storage.setItem(EXTEND_WARRANTY_STORAGE_KEY, moduleConf);
        }
    }, [pluginReady, config, activeStoreCode, setModuleConfig]);

    useEffect(()=> {
        if (pluginReady)
            return;

        if (moduleConfig) {
            loadExtendWarrantyPlugin(moduleConfig, isCartPage, () => {
                setPluginReady(true);
            });
        }
    }, [pluginReady, moduleConfig, isCartPage]);

    return (
        <ExtendWarrantyContext.Provider value={{ pluginReady, moduleConfig }}>
            {props.children}
        </ExtendWarrantyContext.Provider>
    );
};

/**
 * The current context value for the Extend Warranty context.
 *
 * Use this inside a {@link ExtendWarrantyContextProvider}.
 *
 * @type number
 */
export const useExtendWarranty = () => useContext(ExtendWarrantyContext);
