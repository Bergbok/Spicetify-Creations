import React from 'react';

interface ShuffleButtonProps {
    shuffleState: boolean;
    toggleShuffle: () => void;
};

const ShuffleButton = ({ shuffleState, toggleShuffle }: ShuffleButtonProps) => {
    // const tippyContent = shuffleState 
    //     ? "Disable Shuffle for Playlist Selection" 
    //     : "Enable Shuffle for Playlist Selection";

    return (
        <React.Fragment>
            <style>
                {`
                .shuffle-container {
                    height: 50px;
                    padding-left: 25px;
                    position: relative;
                    width: 50px;
                }
                .shuffle-enabled { 
                    cursor: pointer;
                    filter: brightness(0) saturate(100%) invert(79%) sepia(29%) saturate(5880%) hue-rotate(87deg) brightness(87%) contrast(81%);
                    position: absolute;
                    right: -10px;
                    top: 22px;
                    transform: scale(2.1);
                    transition: transform 0.3s ease;
                }
                .shuffle-enabled:hover {
                    filter: brightness(0) saturate(100%) invert(79%) sepia(29%) saturate(5880%) hue-rotate(87deg) brightness(100%) contrast(81%);
                    transform: scale(2.2);
                }
                .shuffle-disabled {
                    cursor: pointer;
                    position: absolute;
                    right: -10px;
                    top: 22px;
                    transform: scale(2.1);
                    transition: transform 0.3s ease;
                }
                .shuffle-disabled:hover {
                    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
                    transform: scale(2.2);
                }
                .dot-icon {
                    position: relative;
                    right: 0px;
                    top: 0px;
                    transform: scale(0.5);
                }
                `}
            </style>
            <div className='shuffle-container'>
                <Spicetify.ReactComponent.IconComponent
                    className = {shuffleState ? 'shuffle-enabled' : 'shuffle-disabled'}
                    dangerouslySetInnerHTML = {{ __html: Spicetify.SVGIcons["shuffle"]}}
                    onClick = {toggleShuffle}>
                </Spicetify.ReactComponent.IconComponent>
                {/* {shuffleState && (
                    <Spicetify.ReactComponent.IconComponent
                        className = {shuffleState ? 'dot-icon' : ''}
                        dangerouslySetInnerHTML = {{ __html: Spicetify.SVGIcons["play"]}}
                        onClick = {toggleShuffle}>
                    </Spicetify.ReactComponent.IconComponent>
                )} */}
            </div>
        </React.Fragment>
    );
};

export default ShuffleButton;