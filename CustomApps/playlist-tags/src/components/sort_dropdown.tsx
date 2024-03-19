import React from 'react';

/**
 * Props for the SortDropdown component.
 * 
 * @typedef {Object} SortDropdownProps
 * @property {string[]} items - The items to be displayed in the dropdown.
 * @property {(value: string) => void} onSelect - Callback function that is called when an item is selected.
 */
interface SortDropdownProps {
    items: string[];
    onSelect: (value: string) => void;
    selected?: string;
};

/**
 * A dropdown component that displays a list of items and calls a callback function when an item is selected.
 * This component is specifically used for sorting operations.
 * 
 * @param {SortDropdownProps} props - The props for the component.
 * @returns {JSX.Element} The SortDropdown component.
 */
const SortDropdown = ({ items, onSelect, selected }: SortDropdownProps) => {
    return (
        <React.Fragment>
            <style>
              {`
                .sort-dropdown-wrapper {
                    padding-left: 10px; 
                    padding-right: 25px; 
                    width: max-content;
                    min-width: 222px;
                }
              `}
            </style>
            <div className = 'sort-dropdown-wrapper'>
                <Spicetify.ReactComponent.Dropdown
                    onSelect={onSelect}
                    value={selected}
                >
                {
                    items.map((item, index) => (
                        <option key={index} value={item}>{item}</option>
                    ))
                }
                </Spicetify.ReactComponent.Dropdown>
            </div>
        </React.Fragment>
    );
};

export default SortDropdown;