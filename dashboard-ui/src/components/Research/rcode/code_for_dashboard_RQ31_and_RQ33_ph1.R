library(readxl)
library(janitor)

datafile_rq13 = "data/RQ-1_and_RQ-3 data.xlsx"
rq13_df = as.data.frame(read_excel(datafile_rq13))
names(rq13_df) = make_clean_names(names(rq13_df))
rq13_df = rq13_df[rq13_df$competence_error == 0, ]

# -------- RQ 3.1 --------------
binom_test_data = rq13_df[rq13_df$adm_type == "comparison",]

# Binomial Test of Proportions Aligned vs. Baseline
num_successes_aligned_baseline = sum(binom_test_data$delegation_preference_a_b == "A", na.rm = T)
num_failures_aligned_baseline = sum(binom_test_data$delegation_preference_a_b == "B", na.rm = T)
ab_binom_test = binom.test(c(num_successes_aligned_baseline, num_failures_aligned_baseline), p=0.5)
ab_binom_test

# Binomial Test of Proportions Aligned vs. Misaligned
num_successes_aligned_misaligned = sum(binom_test_data$delegation_preference_a_m == "A", na.rm = T)
num_failures_aligned_misaligned = sum(binom_test_data$delegation_preference_a_m == "M", na.rm = T)
am_binom_test = binom.test(c(num_successes_aligned_misaligned, num_failures_aligned_misaligned), p=0.5)
am_binom_test
# ================================


# --------- RQ 3.3 ---------------
rq13_df$trust_rating = as.numeric(rq13_df$trust_rating)
anova_data = rq13_df[,c("delegator_id","trust_rating", "delegation_preference_a_b", "delegation_preference_a_m")]

ab_aov_resutls = aov(trust_rating ~ delegation_preference_a_b + Error(delegator_id / delegation_preference_a_b), data=anova_data[anova_data$delegation_preference_a_b %in% c('A','B'),])
am_aov_resutls = aov(trust_rating ~ delegation_preference_a_m + Error(delegator_id / delegation_preference_a_m), data=anova_data[anova_data$delegation_preference_a_m %in% c('A','M'),])

summary(ab_aov_resutls)
summary(am_aov_resutls)
# ================================
