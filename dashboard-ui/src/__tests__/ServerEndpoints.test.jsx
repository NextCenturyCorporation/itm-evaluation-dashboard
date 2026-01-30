/**
 * @jest-environment puppeteer
 */
import axios from 'axios';

const ADEPT_URL = process.env.REACT_APP_ADEPT_URL;
const IS_PH1 = Number(process.env.REACT_APP_TEST_SURVEY_VERSION) <= 5;


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
    if (!IS_PH1) {
      it('should submit responses to ADEPT server successfully', async () => {
        const sessionResponse = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
        const sessionId = sessionResponse.data;

        // dummy probe response for adept
        const responsePayload = {
          response: {
            choice: IS_PH1 ? 'Response 2B' : 'Response 2-B',
            justification: 'justification',
            probe_id: 'Probe 2',
            scenario_id: IS_PH1 ? 'DryRunEval-MJ2-eval' : 'July2025-MF-eval'
          },
          session_id: sessionId
        };

        const response = await axios.post(
          `${ADEPT_URL}/api/v1/response`,
          responsePayload
        );

        expect(response.status).toBe(200);
      });
    }
  });

  describe('KDMA Profile', () => {
    if (!IS_PH1) {
      it('should fetch adept KDMA profile successfully', async () => {
        const sessionResponse = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
        const sessionId = sessionResponse.data;

        const responsePayload = {
          response: {
            choice: IS_PH1 ? 'Response 2B' : 'Response 2-B',
            justification: 'justification',
            probe_id: 'Probe 2',
            scenario_id: IS_PH1 ? 'DryRunEval-MJ2-eval' : 'July2025-MF-eval'
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
    }
  });

  describe('Ordered Alignment', () => {
    if (!IS_PH1) {
      it('should fetch adept ordered alignment data successfully', async () => {
        const sessionResponse = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
        const sessionId = sessionResponse.data;

        const responsePayload = {
          response: {
            choice: IS_PH1 ? 'Response 2B' : 'Response 2-B',
            justification: 'justification',
            probe_id: 'Probe 2',
            scenario_id: IS_PH1 ? 'DryRunEval-MJ2-eval' : 'July2025-MF-eval'
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
              kdma_id: IS_PH1 ? 'Moral judgement' : 'merit'
            }
          }
        );

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBeTruthy();
      });
    }
  });

  describe('Full Workflow Test', () => {
    if (!IS_PH1) {
      it('should complete a full workflow with ADEPT server', async () => {
        // starts adept sessions, responds to probe, gets kdma, and calls ordered alignment
        // checks each step as we go
        const sessionResponse = await axios.post(`${ADEPT_URL}/api/v1/new_session`);
        const sessionId = sessionResponse.data;
        expect(sessionResponse.status).toBe(200);

        const responsePayload = {
          response: {
            choice: IS_PH1 ? 'Response 2B' : 'Response 2-B',
            justification: 'justification',
            probe_id: 'Probe 2',
            scenario_id: IS_PH1 ? 'DryRunEval-MJ2-eval' : 'July2025-MF-eval'
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
              kdma_id: IS_PH1 ? 'Moral judgement' : 'merit'
            }
          }
        );
        expect(alignmentResponse.status).toBe(200);
      });
    }
  });

  describe('Comparing Two Sessions', () => {
    if (!IS_PH1) {
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
            choice: IS_PH1 ? 'Response 2B' : 'Response 2-B',
            justification: 'justification',
            probe_id: 'Probe 2',
            scenario_id: IS_PH1 ? 'DryRunEval-MJ2-eval' : 'July2025-MF-eval'
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
    }
  });
});
