import React from 'react';

interface PlayButtonProps {
    onClick: () => void;
};

const PlayButton = ({ onClick }: PlayButtonProps) => {
    return (
        <React.Fragment>
            <style>
            {`
                .play-container {
                    padding-left: 35px;
                }
                .play-button {
                    cursor: pointer;
                    background-color: var(--spice-button-active);
                    border-radius: 100%;
                    height: 50px;
                    position: relative;
                    transition: transform 0.3s ease;
                    width: 50px;
                }
                .play-button:hover {
                    transform: scale(1.1);
                }
                .play-icon {
                    left: 50%;  
                    position: absolute;  
                    top: 50%;  
                    transform: scale(1.5) translate(-15%, -15%);  
                }
            `}
            </style>
            <div className='play-container'>
                <button className='play-button' onClick={onClick}>
                    <Spicetify.ReactComponent.IconComponent
                        className = {'play-icon'}
                        semanticColor = "black"
                        dangerouslySetInnerHTML = {{ __html: Spicetify.SVGIcons["play"]}}>
                    </Spicetify.ReactComponent.IconComponent>
                </button>
            </div>
        </React.Fragment>
    );
};

export default PlayButton;