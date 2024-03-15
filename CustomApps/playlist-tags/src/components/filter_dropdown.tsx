import React from 'react';

interface FilterDropdownProps {
    items: string[];
    onSelect: (value: string) => void;
};

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