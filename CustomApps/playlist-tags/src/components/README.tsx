import React, { useEffect, useState } from 'react';
import { marked }  from 'marked';
import GitHubIcon from './Icons/GitHubIcon';

/**
 * Props for the README component.
 * 
 * @typedef {Object} READMEProps
 * @property {string} raw_url - The URL to fetch the raw markdown content.
 * @property {string} GitHub_button_url - The URL to open when the GitHub button is clicked.
 */
interface READMEProps {
  raw_url: string;
  GitHub_button_url: string;
};

/**
 * A component that fetches and displays a README file from a given URL.
 * The README content is stripped of links and the installation section.
 * A GitHub button is also displayed, which opens a given URL when clicked.
 * 
 * @param {READMEProps} props - The props for the component.
 * @returns {JSX.Element} The README component.
 */
const README = ({ raw_url, GitHub_button_url: GitHub_button_url }: READMEProps) => {
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    fetch(raw_url)
      .then(response => response.text())
      .then(text => { 
        // Removes links and installation section
        let stripped_markdown = text.replace(/\[(.*?)\]\(.*?\)/g, '$1'); 
        stripped_markdown = stripped_markdown.replace(/\n## Installation[\s\S]*?(?=##|$)/g, '');
        setMarkdown(stripped_markdown);
      });
  }, []);

  return (
    <React.Fragment>
      <style>
        {`
          .README-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
          }
          .README > * {
            margin-bottom: 15px;
          }
          .GitHub-button-wrapper {
            position: absolute;
            right: 20px;
          }
        `}
      </style>
      <div className='GitHub-button-wrapper'>
        <Spicetify.ReactComponent.ButtonPrimary 
          iconLeading={GitHubIcon}
          colorSet='invertedLight'
          aria-label='Open GitHub repository'
          onClick={() => window.open(GitHub_button_url)}>{'GitHub'}
        </Spicetify.ReactComponent.ButtonPrimary>
      </div>
      <div className='README-wrapper'>
        <div className='README' dangerouslySetInnerHTML={{ __html: marked.parse(markdown) }}/>
      </div>
    </React.Fragment>
  );
}

export default README;