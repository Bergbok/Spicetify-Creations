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
                .dropdown-wrapper {
                    padding-left: 10px; 
                    padding-right: 25px; 
                    width: 330px;
                }
              `}
            </style>
            <div className = 'dropdown-wrapper'>
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