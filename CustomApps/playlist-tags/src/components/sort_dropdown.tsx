import React from 'react';

interface SortDropdownProps {
    items: string[];
    onSelect: (value: string) => void;
};

const SortDropdown = ({ items, onSelect }: SortDropdownProps) => {
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