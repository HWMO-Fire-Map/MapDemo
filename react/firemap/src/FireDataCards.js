import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, Link } from '@mui/material';

const FireDataCards = () => {
  const [textFromFile, setTextFromFile] = useState('');

  useEffect(() => {
    // Function to fetch text file content from the Flask backend
    const fetchTextFromFile = async () => {
      try {
        const response = await axios.get('/get_text_file');
        setTextFromFile(response.data.text_content);
      } catch (error) {
        console.error('Error fetching text file:', error);
      }
    };

    fetchTextFromFile();
  }, []);

  const generateCardsFromTextFile = () => {
    if (textFromFile) {
      const sections = textFromFile.split('\n\n');
      const cards = [];
  
      for (let i = 0; i < sections.length; i += 3) {
        const information = sections[i].replace('Information:', '').trim();
        const abstract = sections[i + 1].replace('Abstract:', '').trim();
        const link = sections[i + 2].replace('Link:', '').trim();
  
        const card = (
          <Card key={i / 3} variant="outlined" sx={{ marginBottom: '20px' }}>
            <CardContent>
              <Typography variant="body1" sx={{ color: '#02002e' }}>
                <strong>Information: </strong>{information}<br /><br />
                <strong>Abstract: </strong>{abstract}<br /><br />
                <strong>Link: </strong>
                <Link href={link} target="_blank" rel="noopener">
                  {link}
                </Link>
              </Typography>
            </CardContent>
          </Card>
        );
  
        cards.push(card);
      }
  
      return cards;
    }
    return null; // Return null if textFromFile is undefined/empty
  };
  

  return (
    <div>
      {generateCardsFromTextFile()}
    </div>
  );
};

export default FireDataCards;
