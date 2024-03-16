// Modified version of https://github.com/harbassan/spicetify-apps/blob/main/library/src/components/text_input_dialog.tsx

import React, { FormEvent } from 'react';

/**
 * Props for the TextInputDialog component.
 * 
 * @typedef {Object} TextInputDialogProps
 * @property {string} def - The default value of the text input.
 * @property {string} placeholder - The placeholder text for the text input.
 * @property {(value: string) => void} onSave - Callback function that is called when the form is submitted.
 */
interface TextInputDialogProps {
    def: string;
    placeholder: string;
    onSave: (value: string) => void;
};

/**
 * A dialog component that contains a text input and a save button.
 * When the form is submitted, the onSave callback is called with the current value of the text input.
 * 
 * @param {TextInputDialogProps} props - The props for the component.
 * @returns {JSX.Element} The TextInputDialog component.
 */
const TextInputDialog = ({ def, placeholder, onSave }: TextInputDialogProps): JSX.Element => {
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
        <form className='text-input-form' onSubmit={onSubmit}>
            <label className={'text-input-wrapper'}>
                <input
                    className={'text-input'}
                    type='text'
                    value={value}
                    placeholder={placeholder}
                    spellCheck='false'
                    onChange={(e) => setValue(e.target.value)}/>
            </label>
            <button type='submit' className='modal-button'>
                <span className='ButtonInner-sc-14ud5tc-0 ButtonInner-small encore-bright-accent-set'>Save</span>
            </button>
        </form>
    </>);
};

export default TextInputDialog;
