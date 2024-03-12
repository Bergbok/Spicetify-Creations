// Modified version of https://github.com/harbassan/spicetify-apps/blob/main/library/src/components/text_input_dialog.tsx

import React, { FormEvent } from "react";

const TextInputDialog = (props: { def: string; placeholder: string; onSave: (value: string) => void }) => {
    const { def, placeholder, onSave } = props;
    const [value, setValue] = React.useState(def);

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        Spicetify.PopupModal.hide();
        onSave(value);
    };

    return (<>
        <style>
        {`
            .modal-button {
                width: 20%;
                color: var(--spice-shadow);
                background-color: var(--spice-button);
                border-radius: 9999px;
            }
            .text-input{
                width: 75%;
                color: var(--spice-text);
                background-color: var(--spice-background);
                border-radius: 9999px;
                margin-right: 5%;
                background-color: rgb(36, 36, 36);
                padding-left: 10px;
            }
            .text-input:hover {
                background-color: rgb(42, 42, 42);
            }
            .text-input:focus {
                border-color: rgb(221, 221, 221);
            }
        `}
        </style>
        <form className="text-input-form" onSubmit={onSubmit}>
            <label className={"text-input-wrapper"}>
                <input
                    className={"text-input"}
                    type="text"
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => setValue(e.target.value)}/>
            </label>
            <button type="submit" className="modal-button">
                <span className="ButtonInner-sc-14ud5tc-0 ButtonInner-small encore-bright-accent-set">Save</span>
            </button>
        </form>
    </>);
};

export default TextInputDialog;
