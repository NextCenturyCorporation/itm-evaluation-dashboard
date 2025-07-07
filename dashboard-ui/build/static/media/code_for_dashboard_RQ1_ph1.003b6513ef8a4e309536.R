library(readxl)
library(janitor)
library(lme4)

datafile_rq13 = "data/RQ-1_and_RQ-3 data.xlsx"
rq13_df = as.data.frame(read_excel(datafile_rq13))
names(rq13_df) = make_clean_names(names(rq13_df))
rq13_df = rq13_df[rq13_df$competence_error == 0, ]

rq13_df$alignment_score_delegator_observed_adm_target = as.numeric(rq13_df$alignment_score_delegator_observed_adm_target)
rq13_df$trust_rating = as.numeric(rq13_df$trust_rating)

io_data = rq13_df[rq13_df$attribute=="IO",]
mj_data = rq13_df[rq13_df$attribute=="MJ",]
qol_data = rq13_df[rq13_df$attribute=="QOL",]
vol_data = rq13_df[rq13_df$attribute=="VOL",]


# ----------------- RQ 1.1 -------------------------
## IO
model_rq11_io = lmer(trust_rating ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), data=io_data)
summary(model_rq11_io)

## MJ
model_rq11_mj = lmer(trust_rating ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), data=mj_data)
summary(model_rq11_mj)

## QOL
model_rq11_qol = lmer(trust_rating ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), data=qol_data)
summary(model_rq11_qol)

## VOL
model_rq11_vol = lmer(trust_rating ~ alignment_score_delegator_observed_adm_target + (1 | delegator_id), data=vol_data)
summary(model_rq11_vol)
# ==================================================

# ----------------- RQ 1.2 -------------------------
aov_rq12_io = aov(trust_rating ~ adm_aligned_status_baseline_misaligned_aligned + Error (delegator_id / adm_aligned_status_baseline_misaligned_aligned), data=io_data)
summary(aov_rq12_io)

aov_rq12_mj = aov(trust_rating ~ adm_aligned_status_baseline_misaligned_aligned + Error (delegator_id / adm_aligned_status_baseline_misaligned_aligned), data=mj_data)
summary(aov_rq12_mj)

aov_rq12_qol = aov(trust_rating ~ adm_aligned_status_baseline_misaligned_aligned + Error (delegator_id / adm_aligned_status_baseline_misaligned_aligned), data=qol_data)
summary(aov_rq12_qol)

aov_rq12_vol = aov(trust_rating ~ adm_aligned_status_baseline_misaligned_aligned + Error (delegator_id / adm_aligned_status_baseline_misaligned_aligned), data=vol_data)
summary(aov_rq12_vol)
# ==================================================


