import React from "react";
import { ExtendWarrantyContextProvider } from "../context/extendWarranty";
import { GET_EXTEND_WARRANTY_CONFIG } from '../queries/getExtendWarrantyConfig.gql';

const ExtendWarrantyInstallation = (props) => {
    return (
        <ExtendWarrantyContextProvider isCartPage={props.isCartPage} fetchConfigQuery={GET_EXTEND_WARRANTY_CONFIG}>
            {props.children}
        </ExtendWarrantyContextProvider>
    );
}

export default ExtendWarrantyInstallation;
