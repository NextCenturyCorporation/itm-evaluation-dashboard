import React from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

const AlignmentScoreBox = ({ performer, data, scenario }) => {
  let score = null
  let sessionId = null;

  if (data.history !== null && data.history !== undefined) {
    const lastHistoryItem = data.history[data.history.length - 1];
    if (lastHistoryItem?.response?.score !== undefined) {
      score = lastHistoryItem.response.score.toFixed(4);
    }

    for (let i = 0; i < data.history.length - 1; i++) {
      if (data.history[i].command === "TA1 Alignment Target Session ID") {
        sessionId = data.history[i].response;
      }
    }
  }

  return (
    <Box className="scoreBox">
      <Typography variant="h5">
        {performer}
      </Typography>
      
      {score !== null && (
        <Typography variant="h5">
          Alignment Score: {score}
        </Typography>
      )}
      
      {scenario === 'kickoff-demo-scenario-1' && sessionId && (
        <iframe 
          src={`http://localhost:8084/graph/session/${sessionId}`} 
          title="SoarGraph" 
          width="800px" 
          height="800px"
        />
      )}
    </Box>
  );
}

export default AlignmentScoreBox;
