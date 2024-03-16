import React from 'react';

/**
 * Props for the FilterDropdown component.
 * 
 * @typedef {Object} FilterDropdownProps
 * @property {string[]} items - The items to be displayed in the dropdown.
 * @property {(value: string) => void} onSelect - Callback function that is called when an item is selected.
 */
interface FilterDropdownProps {
    items: string[];
    onSelect: (value: string) => void;
};

/**
 * A dropdown component that displays a list of items and calls a callback function when an item is selected.
 * This component is specifically used for determining the filter type (AND/OR).
 * 
 * @param {FilterDropdownProps} props - The props for the component.
 * @returns {JSX.Element} The FilterDropdown component.
 */
const FilterDropdown = ({ items, onSelect }: FilterDropdownProps) => {
    return (
        <React.Fragment>
            <style>
              {`
                .filter-dropdown-wrapper {
                    padding-left: 10px; 
                    width: max-content;
                    min-width: 222px;
                }
              `}
            </style>
            <div className='filter-dropdown-wrapper'>
                <Spicetify.ReactComponent.Dropdown
                    onSelect={onSelect}
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

export default FilterDropdown;