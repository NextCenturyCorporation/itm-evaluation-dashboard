import axios from 'axios';

describe('TA1 Server Integration Tests', () => {
  // if these tests two fail, the others have no hope
  describe('Session Creation', () => {
    it('should create a new ADEPT session successfully', async () => {
      const response = await axios.post(`${process.env.REACT_APP_ADEPT_URL}/api/v1/new_session`);
      
      // check response status and that the session id is returned
      expect(response.status).toBe(200);
      expect(response.data).toBeTruthy();
    });

    it('should create a new SoarTech session successfully', async () => {
      const response = await axios.post(
        `${process.env.REACT_APP_SOARTECH_URL}/api/v1/new_session?user_id=default_user`
      );

      expect(response.status).toBe(201);
      expect(response.data).toBeTruthy();
    });
  });

  describe('Response Submission', () => {
    it('should submit responses to ADEPT server successfully', async () => {
      const sessionResponse = await axios.post(`${process.env.REACT_APP_ADEPT_URL}/api/v1/new_session`);
      const sessionId = sessionResponse.data;

      // dummy probe response for adept
      const responsePayload = {
        response: {
          choice: 'Response 2B',
          justification: 'justification',
          probe_id: 'Probe 2',
          scenario_id: 'DryRunEval-MJ2-eval',
        },
        session_id: sessionId
      };

      const response = await axios.post(
        `${process.env.REACT_APP_ADEPT_URL}/api/v1/response`,
        responsePayload
      );
      
      expect(response.status).toBe(200);
    });
  });

  describe('KDMA Profile', () => {
    it('should fetch KDMA profile successfully', async () => {
      const sessionResponse = await axios.post(`${process.env.REACT_APP_ADEPT_URL}/api/v1/new_session`);
      const sessionId = sessionResponse.data;
      
      const response = await axios.get(
        `${process.env.REACT_APP_ADEPT_URL}/api/v1/computed_kdma_profile`,
        { params: { session_id: sessionId } }
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeTruthy();
    });
  });

  describe('Ordered Alignment', () => {
    it('should fetch ordered alignment data successfully', async () => {
      const sessionResponse = await axios.post(`${process.env.REACT_APP_ADEPT_URL}/api/v1/new_session`);
      const sessionId = sessionResponse.data;

      const response = await axios.get(
        `${process.env.REACT_APP_ADEPT_URL}/api/v1/get_ordered_alignment`,
        {
          params: {
            session_id: sessionId,
            kdma_id: 'Moral judgement'
          }
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBeTruthy();
    });
  });

  describe('Alignment Data', () => {
    it('should fetch SoarTech alignment data successfully', async () => {
      const sessionResponse = await axios.post(
        `${process.env.REACT_APP_SOARTECH_URL}/api/v1/new_session?user_id=default_user`
      );
      const sessionId = sessionResponse.data;

      const response = await axios.get(
        `${process.env.REACT_APP_SOARTECH_URL}/api/v1/alignment/session`,
        {
          params: {
            session_id: sessionId,
            target_id: 'QualityOfLife'
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toBeTruthy();
    });
  });


  describe('Full Workflow Test', () => {
    it('should complete a full workflow with ADEPT server', async () => {
      const sessionResponse = await axios.post(`${process.env.REACT_APP_ADEPT_URL}/api/v1/new_session`);
      const sessionId = sessionResponse.data;
      expect(sessionResponse.status).toBe(200);

      const responsePayload = {
        response: {
          choice: 'Response 2B',
          justification: 'justification',
          probe_id: 'Probe 2',
          scenario_id: 'DryRunEval-MJ2-eval',
        },
        session_id: sessionId
      };

      await axios.post(
        `${process.env.REACT_APP_ADEPT_URL}/api/v1/response`,
        responsePayload
      );


      const kdmaResponse = await axios.get(
        `${process.env.REACT_APP_ADEPT_URL}/api/v1/computed_kdma_profile`,
        { params: { session_id: sessionId } }
      );
      expect(kdmaResponse.status).toBe(200);

      const alignmentResponse = await axios.get(
        `${process.env.REACT_APP_ADEPT_URL}/api/v1/get_ordered_alignment`,
        {
          params: {
            session_id: sessionId,
            kdma_id: 'Moral judgement'
          }
        }
      );
      expect(alignmentResponse.status).toBe(200);
    });

    it('should complete a full workflow with SoarTech server', async () => {
      const sessionResponse = await axios.post(
        `${process.env.REACT_APP_SOARTECH_URL}/api/v1/new_session?user_id=default_user`
      );
      const sessionId = sessionResponse.data;
      expect(sessionResponse.status).toBe(201);

      const alignmentResponse = await axios.get(
        `${process.env.REACT_APP_SOARTECH_URL}/api/v1/alignment/session`,
        {
          params: {
            session_id: sessionId,
            target_id: 'QualityOfLife'
          }
        }
      );
      expect(alignmentResponse.status).toBe(200);
    });
  });
});
