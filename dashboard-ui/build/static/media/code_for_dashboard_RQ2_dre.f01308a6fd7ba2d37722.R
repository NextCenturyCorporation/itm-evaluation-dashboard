library(readxl)
library(janitor)

datafile_rq21 = "data/RQ-21 data.xlsx"
datafile_rq2223 = "data/RQ-22_and_RQ-23 data.xlsx"
rq21_df = as.data.frame(read_excel(datafile_rq21))
rq2223_df = as.data.frame(read_excel(datafile_rq2223))

names(rq21_df) = make_clean_names(names(rq21_df))
names(rq2223_df) = make_clean_names(names(rq2223_df))

kitware_rq21_df = rq21_df[rq21_df$source == "Kitware",]
parallax_rq21_df = rq21_df[rq21_df$source == "Parallax",]

kitware_rq2223_df = rq2223_df[rq2223_df$ta2_name == "Kitware",]
parallax_rq2223_df = rq2223_df[rq2223_df$ta2_name == "Parallax",]


# ----------- RQ 2.1 --------------


# =================================


# ----------- RQ 2.2 --------------
# Kitware
# - MJ
k_mj_2223_df = kitware_rq2223_df[(kitware_rq2223_df$attribute=="MJ") & (kitware_rq2223_df$target_type_group_individual=="Group"),] 
t.test(k_mj_2223_df$aligned_adm_alignment_score_adm_target, k_mj_2223_df$baseline_adm_alignment_score_adm_target)

# - IO
k_io_2223_df = kitware_rq2223_df[(kitware_rq2223_df$attribute=="IO") & (kitware_rq2223_df$target_type_group_individual=="Group"),] 
t.test(k_io_2223_df$aligned_adm_alignment_score_adm_target, k_io_2223_df$baseline_adm_alignment_score_adm_target)

# - QOL
k_qol_2223_df = kitware_rq2223_df[(kitware_rq2223_df$attribute=="QOL") & (kitware_rq2223_df$target_type_group_individual=="Group"),] 
t.test(k_qol_2223_df$aligned_adm_alignment_score_adm_target, k_qol_2223_df$baseline_adm_alignment_score_adm_target)


# - VOL
k_vol_2223_df = kitware_rq2223_df[(kitware_rq2223_df$attribute=="VOL") & (kitware_rq2223_df$target_type_group_individual=="Group"),] 
t.test(k_vol_2223_df$aligned_adm_alignment_score_adm_target, k_vol_2223_df$baseline_adm_alignment_score_adm_target)


# Parallax
# - MJ
p_mj_2223_df = parallax_rq2223_df[(parallax_rq2223_df$attribute=="MJ") & (parallax_rq2223_df$target_type_group_individual=="Group"),] 
t.test(p_mj_2223_df$aligned_adm_alignment_score_adm_target, p_mj_2223_df$baseline_adm_alignment_score_adm_target)

# - IO
p_io_2223_df = parallax_rq2223_df[(parallax_rq2223_df$attribute=="IO") & (parallax_rq2223_df$target_type_group_individual=="Group"),] 
t.test(p_io_2223_df$aligned_adm_alignment_score_adm_target, p_io_2223_df$baseline_adm_alignment_score_adm_target)

# - QOL
p_qol_2223_df = parallax_rq2223_df[(parallax_rq2223_df$attribute=="QOL") & (parallax_rq2223_df$target_type_group_individual=="Group"),] 
t.test(p_qol_2223_df$aligned_adm_alignment_score_adm_target, p_qol_2223_df$baseline_adm_alignment_score_adm_target)


# - VOL
p_vol_2223_df = parallax_rq2223_df[(parallax_rq2223_df$attribute=="VOL") & (parallax_rq2223_df$target_type_group_individual=="Group"),] 
t.test(p_vol_2223_df$aligned_adm_alignment_score_adm_target, p_vol_2223_df$baseline_adm_alignment_score_adm_target)
# ==================================


# ----------- RQ 2.3 --------------
# Kitware
# - MJ
k_mj_2223_df = kitware_rq2223_df[(kitware_rq2223_df$attribute=="MJ") & (kitware_rq2223_df$target_type_group_individual=="Individual"),] 
t.test(k_mj_2223_df$aligned_adm_alignment_score_adm_target, k_mj_2223_df$baseline_adm_alignment_score_adm_target)

# - IO
k_io_2223_df = kitware_rq2223_df[(kitware_rq2223_df$attribute=="IO") & (kitware_rq2223_df$target_type_group_individual=="Individual"),] 
t.test(k_io_2223_df$aligned_adm_alignment_score_adm_target, k_io_2223_df$baseline_adm_alignment_score_adm_target)

# - QOL
k_qol_2223_df = kitware_rq2223_df[(kitware_rq2223_df$attribute=="QOL") & (kitware_rq2223_df$target_type_group_individual=="Individual"),] 
t.test(k_qol_2223_df$aligned_adm_alignment_score_adm_target, k_qol_2223_df$baseline_adm_alignment_score_adm_target)


# - VOL
k_vol_2223_df = kitware_rq2223_df[(kitware_rq2223_df$attribute=="VOL") & (kitware_rq2223_df$target_type_group_individual=="Individual"),] 
t.test(k_vol_2223_df$aligned_adm_alignment_score_adm_target, k_vol_2223_df$baseline_adm_alignment_score_adm_target)


# Parallax
# - MJ
p_mj_2223_df = parallax_rq2223_df[(parallax_rq2223_df$attribute=="MJ") & (parallax_rq2223_df$target_type_group_individual=="Individual"),] 
t.test(p_mj_2223_df$aligned_adm_alignment_score_adm_target, p_mj_2223_df$baseline_adm_alignment_score_adm_target)

# - IO
p_io_2223_df = parallax_rq2223_df[(parallax_rq2223_df$attribute=="IO") & (parallax_rq2223_df$target_type_group_individual=="Individual"),] 
t.test(p_io_2223_df$aligned_adm_alignment_score_adm_target, p_io_2223_df$baseline_adm_alignment_score_adm_target)

# - QOL
p_qol_2223_df = parallax_rq2223_df[(parallax_rq2223_df$attribute=="QOL") & (parallax_rq2223_df$target_type_group_individual=="Individual"),] 
t.test(p_qol_2223_df$aligned_adm_alignment_score_adm_target, p_qol_2223_df$baseline_adm_alignment_score_adm_target)


# - VOL
p_vol_2223_df = parallax_rq2223_df[(parallax_rq2223_df$attribute=="VOL") & (parallax_rq2223_df$target_type_group_individual=="Individual"),] 
t.test(p_vol_2223_df$aligned_adm_alignment_score_adm_target, p_vol_2223_df$baseline_adm_alignment_score_adm_target)
# ==================================