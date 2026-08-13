/**
 * @jest-environment puppeteer
 */
import axios from 'axios';

const ADEPT_URL = process.env.REACT_APP_ADEPT_URL;


// Note: All Soartech tests have been removed 
jest.setTimeout(40000);

describe('TA1 Server Tests', () => {
  // if these tests two fail, the others have no hope
  describe('Session Creation', () => {
    it('should create a new ADEPT session successfully', async () => {
      const response = await axios.post(`${ADEPT_URL}/api/v1/new_session`);

      // check response status and that the session id is returned
      expect(response.status).toBe(200);
      expect(response.data).toBeTruthy();
    });
  });

  describe('Response Submission', () => {
      it('should submit responses to ADEPT server successfully', async () => {
        try {
          const sessionResponse = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
          const sessionId = sessionResponse.data;

          // dummy probe response for adept
          const responsePayload = {
            response: {
              choice: 'Response 1004-B',
              justification: 'justification',
              probe_id: 'Probe 1004',
              scenario_id: 'June2026-MF-assess'
            },
            session_id: sessionId
          };

          const response = await axios.post(
            `${ADEPT_URL}/api/v1/response`,
            responsePayload
          );

          expect(response.status).toBe(200);
        }
        catch (error) {
          console.error('ADEPT status:', error.response?.status);
          console.error('ADEPT response:', error.response?.data);
          console.error('ADEPT request URL:', error.config?.url);
          console.error('ADEPT request data:', error.config?.data);
          throw error;
        }
      });
  });

  describe('KDMA Profile', () => {
      it('should fetch adept KDMA profile successfully', async () => {
        const sessionResponse = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
        const sessionId = sessionResponse.data;

        const responsePayload = {
          response: {
            choice: 'Response 1004-B',
            justification: 'justification',
            probe_id: 'Probe 1004',
            scenario_id: 'June2026-MF-assess'
          },
          session_id: sessionId
        };

        // post probe response before calling kdma 
        await axios.post(
          `${ADEPT_URL}/api/v1/response`,
          responsePayload
        );

        const response = await axios.get(
          `${ADEPT_URL}/api/v1/computed_kdma_profile`,
          { params: { session_id: sessionId } }
        );

        expect(response.status).toBe(200);
        expect(response.data).toBeTruthy();
      });
  });

  describe('Ordered Alignment', () => {
      it('should fetch adept ordered alignment data successfully', async () => {
        const sessionResponse = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
        const sessionId = sessionResponse.data;

        const responsePayload = {
          response: {
            choice: 'Response 1004-B',
            justification: 'justification',
            probe_id: 'Probe 1004',
            scenario_id: 'June2026-MF-assess'
          },
          session_id: sessionId
        };

        // post probe response before calling kdma 
        await axios.post(
          `${ADEPT_URL}/api/v1/response`,
          responsePayload
        );

        const response = await axios.get(
          `${ADEPT_URL}/api/v1/get_ordered_alignment`,
          {
            params: {
              session_id: sessionId,
              kdma_id: 'merit'
            }
          }
        );

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBeTruthy();
      });
  });

  describe('Full Workflow Test', () => {
      it('should complete a full workflow with ADEPT server', async () => {
        // starts adept sessions, responds to probe, gets kdma, and calls ordered alignment
        // checks each step as we go
        const sessionResponse = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
        const sessionId = sessionResponse.data;
        expect(sessionResponse.status).toBe(200);

        const responsePayload = {
          response: {
            choice: 'Response 1004-B',
            justification: 'justification',
            probe_id: 'Probe 1004',
            scenario_id: 'June2026-MF-assess'
          },
          session_id: sessionId
        };

        const probeResponse = await axios.post(
          `${ADEPT_URL}/api/v1/response`,
          responsePayload
        );
        expect(probeResponse.status).toBe(200);


        const kdmaResponse = await axios.get(
          `${ADEPT_URL}/api/v1/computed_kdma_profile`,
          { params: { session_id: sessionId } }
        );
        expect(kdmaResponse.status).toBe(200);

        const alignmentResponse = await axios.get(
          `${ADEPT_URL}/api/v1/get_ordered_alignment`,
          {
            params: {
              session_id: sessionId,
              kdma_id: 'merit'
            }
          }
        );
        expect(alignmentResponse.status).toBe(200);
      });
  });

  describe('Comparing Two Sessions', () => {
      it('Should compare two adept sessions using /compare_sessions', async () => {
        // start sessions
        const sessionResponse1 = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
        const sessionId1 = sessionResponse1.data;
        expect(sessionResponse1.status).toBe(200);

        const sessionResponse2 = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
        const sessionId2 = sessionResponse2.data;
        expect(sessionResponse2.status).toBe(200);

        // dummy probe responses
        const responsePayload = {
          response: {
            choice: 'Response 1004-B',
            justification: 'justification',
            probe_id: 'Probe 1004',
            scenario_id: 'June2026-MF-assess'
          }
        };

        // submit dummy probe response for each session
        await axios.post(
          `${ADEPT_URL}/api/v1/response`,
          { ...responsePayload, session_id: sessionId1 }
        );

        await axios.post(
          `${ADEPT_URL}/api/v1/response`,
          { ...responsePayload, session_id: sessionId2 }
        );

        const response = await axios.get(
          `${ADEPT_URL}/api/v1/alignment/compare_sessions`,
          {
            params: {
              session_id_1: sessionId1,
              session_id_2: sessionId2,
            }
          }
        );
        expect(response.status).toBe(200);
        expect(response.data).toBeTruthy();
      });
  });
});
