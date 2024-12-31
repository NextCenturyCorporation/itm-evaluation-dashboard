library(readxl)
library(janitor)
library(ggplot2)

data_filename = "data/RQ-21 data.xlsx"
rq21_df = read_excel(data_filename)

names(rq21_df) = make_clean_names(names(rq21_df))
names(rq21_df)[names(rq21_df)=="alignment_score_individual_group_target_or_adm_group_target"] = "alignment"

# Create the 'target_group' and 'dm_type' columns in data_rq1
rq21_df$target_group <- sapply(strsplit(rq21_df$group_target, "-"), function(x) x[5])
rq21_df$dm_type <- ifelse(rq21_df$decision_maker %in% c('Aligned ADM', 'Baseline ADM'), 
                          rq21_df$decision_maker, 'Human')

# Aggregate data_rq1 by filtering out 'Human' and calculating mean alignment
rq21_df_agg <- aggregate(alignment ~ target_group + attribute + source + dm_type, 
                          data = subset(rq21_df, source != 'Human'), 
                          FUN = function(x) mean(x, na.rm = TRUE))

# Bind the rows of 'data_rq1_agg' with 'Human' source data
rq21_df_agg <- rbind(rq21_df_agg, subset(rq21_df, source == 'Human')[,c("target_group", "attribute", "source", "dm_type", "alignment")])

# Calculate the 'hline_value' for 'lines_data'
lines_data <- aggregate(alignment ~ attribute + target_group, 
                        data = subset(data_rq1, source == 'Human'), 
                        FUN = function(x) min(x, na.rm = TRUE))
names(lines_data)[names(lines_data) == "alignment"] = "hline_value"

# Perform left join of 'data_rq1_agg' with 'lines_data'
rq21_df_agg <- merge(rq21_df_agg, lines_data, by = c("attribute", "target_group"), all.x = TRUE)

# Filter for 'Parallax' and 'Kitware' sources, including 'Human' source
rq21_df_parallax <- subset(rq21_df, source %in% c('Parallax', 'Human'))
rq21_df_kitware <- subset(rq21_df, source %in% c('Kitware', 'Human'))

# Filter 'data_rq1_agg' for 'Parallax' and 'Kitware' sources, including 'Human' source
rq21_df_agg_parallax <- subset(rq21_df_agg, source %in% c('Parallax', 'Human'))
rq21_df_agg_kitware <- subset(rq21_df_agg, source %in% c('Kitware', 'Human'))

ggplot(data = rq21_df_agg_parallax, aes(x = target_group, y = alignment, color = dm_type, shape = dm_type))+
  geom_jitter(width = .1, size = 2.5)+
  facet_grid(~attribute,scales = 'free_x')+theme_bw()+
  labs(x = 'Group', y = 'Alignment')+theme(legend.title = element_blank())+
  ggtitle("Parallax ADMs versus human clusters")

ggplot(data = rq21_df_agg_kitware, aes(x = target_group, y = alignment, color = dm_type, shape = dm_type))+
  geom_jitter(width = .2, size = 2.5)+scale_linetype_manual(values=c("dashed","dotted","dashed","dotted"))+
  facet_wrap(attribute~target_group,scales = 'free_x',ncol = 4)+theme_bw()+
  labs(x = 'Group', y = 'Alignment')+theme(legend.title = element_blank(), axis.title.x = element_blank(),axis.text.x = element_blank())+
  ggtitle("Kitware ADMs versus human clusters")+geom_hline(aes(linetype = target_group, yintercept = hline_value))+
  guides(linetype = "none")