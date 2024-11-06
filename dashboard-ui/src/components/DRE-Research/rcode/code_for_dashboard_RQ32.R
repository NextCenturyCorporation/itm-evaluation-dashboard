library(readxl)
library(lme4)
library(janitor)

# ============== read data from files ==========
datafile_rq13 = "data/RQ-1_and_RQ-3 data.xlsx" # Put path to your datafile

rq13_df = as.data.frame(read_excel(datafile_rq13))
# =========================================

# ============== Clean column names, re-code variables and filter data =========
names(rq13_df) = make_clean_names(names(rq13_df))

rq13_df$alignment_score_delegator_observed_adm_target = as.numeric(rq13_df$alignment_score_delegator_observed_adm_target)

rq13_df_delegation = rq13_df[rq13_df$adm_loading != "exemption",]

rq13_df_delegation$delegation_preference_a_b = ifelse(rq13_df_delegation$delegation_preference_a_b == "y", 1, 0)
rq13_df_delegation$delegation_preference_a_m = ifelse(rq13_df_delegation$delegation_preference_a_m == "y", 1, 0)
# ==============================================================================

# ====== Run Regression Models: Aligned vs. Baseline =========
overall_ab_model = glmer(delegation_preference_a_b ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), 
                         family = binomial, data = rq13_df_delegation)

adept_logreg_model_ab = glmer(delegation_preference_a_b ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), 
                              family = binomial, data = rq13_df_delegation[rq13_df_delegation$ta1_name == "Adept",])

st_logreg_model_ab = glmer(delegation_preference_a_b ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), 
                           family = binomial, data = rq13_df_delegation[rq13_df_delegation$ta1_name == "ST",])

mj_logreg_model_ab = glmer(delegation_preference_a_b ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), 
                           family = binomial, data = rq13_df_delegation[rq13_df_delegation$attribute == "MJ",])

io_logreg_model_ab = glmer(delegation_preference_a_b ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), 
                           family = binomial, data = rq13_df_delegation[rq13_df_delegation$attribute == "IO",])

qol_logreg_model_ab = glmer(delegation_preference_a_b ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), 
                            family = binomial, data = rq13_df_delegation[rq13_df_delegation$attribute == "QOL",])

vol_logreg_model_ab = glmer(delegation_preference_a_b ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), 
                            family = binomial, data = rq13_df_delegation[rq13_df_delegation$attribute == "VOL",])
# ============================================================


# ======= Run Regression Models: Aligned vs. Misaligned ========
overall_am_model = glmer(delegation_preference_a_m ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), 
                         family = binomial, data = rq13_df_delegation)

adept_logreg_model_am = glmer(delegation_preference_a_m ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), 
                              family = binomial, data = rq13_df_delegation[rq13_df_delegation$ta1_name == "Adept",])

st_logreg_model_am = glmer(delegation_preference_a_m ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), 
                           family = binomial, data = rq13_df_delegation[rq13_df_delegation$ta1_name == "ST",])

mj_logreg_model_am = glmer(delegation_preference_a_m ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), 
                           family = binomial, data = rq13_df_delegation[rq13_df_delegation$attribute == "MJ",])

io_logreg_model_am = glmer(delegation_preference_a_m ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), 
                           family = binomial, data = rq13_df_delegation[rq13_df_delegation$attribute == "IO",])

qol_logreg_model_am = glmer(delegation_preference_a_m ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), 
                            family = binomial, data = rq13_df_delegation[rq13_df_delegation$attribute == "QOL",])

vol_logreg_model_am = glmer(delegation_preference_a_m ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), 
                            family = binomial, data = rq13_df_delegation[rq13_df_delegation$attribute == "VOL",])

# =============================================================


# Check Model Summary (example)
summary(overall_ab_model)
