import React, { useEffect, useState } from 'react';
import { marked }  from 'marked';
import GitHubIcon from './Icons/GitHubIcon';

interface READMEProps {
  raw_url: string;
  GitHub_button_url: string;
};

const README = ({ raw_url, GitHub_button_url: GitHub_button_url }: READMEProps) => {
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    fetch(raw_url)
      .then(response => response.text())
      .then(text => { 
        // Removes links and installation section
        let stripped_markdown = text.replace(/\[(.*?)\]\(.*?\)/g, ''); 
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
            right: 10px;
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