# CreditSense AI — Machine Learning Equations Reference

This document collects every mathematical equation, formula, and algorithmic definition
used across the CreditSense AI codebase. It is intended as a reference for research
papers and technical reports.

---

## Table of Contents

1. [Data Preprocessing](#1-data-preprocessing)
2. [Feature Engineering](#2-feature-engineering)
3. [Class Balancing](#3-class-balancing)
4. [Model Architectures](#4-model-architectures)
   - 4.1 [Logistic Regression](#41-logistic-regression)
   - 4.2 [Decision Tree — Gini Impurity & Information Gain](#42-decision-tree--gini-impurity--information-gain)
   - 4.3 [Random Forest](#43-random-forest)
   - 4.4 [Gradient Boosting (XGBoost / LightGBM / CatBoost)](#44-gradient-boosting-xgboost--lightgbm--catboost)
   - 4.5 [Stacking Ensemble (Default Risk)](#45-stacking-ensemble-default-risk)
   - 4.6 [R²-Weighted Hybrid Ensemble (Branch Performance)](#46-r-weighted-hybrid-ensemble-branch-performance)
5. [Loss Functions](#5-loss-functions)
6. [Confidence Metric](#6-confidence-metric)
7. [Risk Classification Rules](#7-risk-classification-rules)
8. [Evaluation Metrics](#8-evaluation-metrics)
9. [Model Performance Summary](#9-model-performance-summary)

---

## 1. Data Preprocessing

### 1.1 Missing Value Imputation

All missing numerical values are replaced with zero before training and inference:

$$X_{i,j} = 0 \quad \text{if } X_{i,j} \text{ is missing}$$

### 1.2 Label Encoding

Categorical variables are mapped to integer indices:

$$c \in \{\text{cat}_0, \text{cat}_1, \ldots, \text{cat}_{n-1}\} \;\longmapsto\; \{0, 1, \ldots, n-1\}$$

Applied to: *Branch*, *Gender*, *Facility Type*, *Status*, *NPL Status*.

### 1.3 Standard Scaling (Z-Score Normalisation)

After feature engineering, all numerical features are standardised to zero mean and unit
variance using scikit-learn's `StandardScaler`:

$$X_{\text{scaled}} = \frac{X - \mu}{\sigma}$$

where $\mu$ is the feature mean and $\sigma$ is the feature standard deviation, both
estimated on the training set.

**Reference:** `backend/Lasindu/main.py` — `scaler_advanced.pkl`

---

## 2. Feature Engineering

Eighteen derived features are computed from the seven raw loan attributes before scaling.

| Symbol | Raw Input |
|--------|-----------|
| $r_e$ | Effective interest rate |
| $r_f$ | Flat interest rate |
| $R$ | Net rental (periodic payment) |
| $A$ | Facility amount (principal) |
| $T$ | Tenor (months) |
| $k$ | Number of rentals in arrears |
| $\alpha$ | Customer age (years) |
| $d$ | Days to due date (optional) |

### 2.1 Time-Horizon Features

$$\text{Days\_to\_Due} = d$$

$$\text{Months\_to\_Due} = \frac{d}{30}$$

> **Note:** 30 days per month is a fixed approximation used by the implementation
> (`days / 30`). A calendar-accurate average is ≈ 30.44 days/month.

$$\text{Years\_to\_Due} = \frac{d}{365}$$

### 2.2 Financial Ratio Features

$$\text{Rate\_Difference} = r_e - r_f$$

$$\text{Rental\_to\_Amount\_Ratio} = \frac{R}{A + 1}$$

$$\text{Amount\_per\_Tenor} = \frac{A}{T + 1}$$

$$\text{Rental\_per\_Tenor} = \frac{R}{T + 1}$$

$$\text{Arrears\_Rate} = \frac{k}{T + 1}$$

$$\text{Total\_Payment} = R \times T$$

$$\text{Payment\_Capacity} = \frac{A}{R \times T + 1}$$

> The constant $+1$ in denominators guards against division by zero.

### 2.3 Risk Score Features

$$\text{Risk\_Score} = \frac{k \times r_e}{100}$$

$$\text{Arrears\_Amount} = k \times R$$

### 2.4 Interaction Features

$$\text{Age\_Tenor\_Interaction} = \alpha \times T$$

$$\text{Amount\_Rate\_Interaction} = \frac{A \times r_e}{100}$$

### 2.5 Logarithmic Features

$$\text{Log\_Facility\_Amount} = \ln(1 + A)$$

$$\text{Log\_Net\_Rental} = \ln(1 + R)$$

### 2.6 Polynomial Features

$$\text{Tenor\_Squared} = T^2$$

$$\text{Age\_Squared} = \alpha^2$$

$$\text{Arrears\_Squared} = k^2$$

$$\text{Rate\_Squared} = r_e^2$$

$$\text{Rate\_Cubed} = r_e^3$$

**Reference:** `backend/Lasindu/main.py` — `_engineer_features()`

---

## 3. Class Balancing

### 3.1 Undersampling (Customer Performance Module)

When the minority class (*Poor*) represents fewer than 30 % of samples, the majority
class (*Good*) is downsampled to twice the minority count:

$$N_{\text{good}}^{\prime} = 2 \times N_{\text{poor}}$$

This enforces an approximate 2 : 1 majority-to-minority ratio.

### 3.2 Class-Weight Adjustment

For tree-based and linear classifiers the inverse-frequency weight is applied during
training:

$$w_{\text{good}} : w_{\text{poor}} = \frac{N_{\text{poor}}}{N_{\text{good}}} : 1$$

Used in: Random Forest (`class_weight='balanced'`), XGBoost (`scale_pos_weight`),
Logistic Regression (`class_weight='balanced'`).

---

## 4. Model Architectures

### 4.1 Logistic Regression

The linear score (log-odds) is:

$$z = \beta_0 + \sum_{j=1}^{p} \beta_j x_j$$

The predicted probability of default is obtained via the sigmoid function:

$$\hat{P}(\text{default} \mid \mathbf{x}) = \sigma(z) = \frac{1}{1 + e^{-z}}$$

Equivalently:

$$\hat{P} = \frac{e^{z}}{1 + e^{z}}$$

**Reference:** `backend/Kaveesha/api.py` (meta-learner in stacking ensemble)

### 4.2 Decision Tree — Gini Impurity & Information Gain

At each internal node the algorithm selects the split that maximises Information Gain.

**Gini impurity** of a node $t$ containing $K$ classes with proportions $p_k$:

$$\text{Gini}(t) = 1 - \sum_{k=1}^{K} p_k^2$$

**Entropy** of node $t$:

$$H(t) = -\sum_{k=1}^{K} p_k \log_2 p_k$$

**Information Gain** of split $s$ that partitions $t$ into children $t_L$ and $t_R$:

$$\text{IG}(t, s) = H(t) - \frac{|t_L|}{|t|} H(t_L) - \frac{|t_R|}{|t|} H(t_R)$$

**Reference:** `backend/Kaveesha/decisionTree.ipynb`

### 4.3 Random Forest

A forest of $B$ decision trees $\{h_b\}_{b=1}^{B}$, each trained on a bootstrap sample
of the training data.

**Regression (Impairment / ECL prediction):**

$$\hat{y}_{\text{RF}}(\mathbf{x}) = \frac{1}{B} \sum_{b=1}^{B} h_b(\mathbf{x})$$

**Classification (Default risk):**

$$\hat{P}_{\text{RF}}(\mathbf{x}) = \frac{1}{B} \sum_{b=1}^{B} \mathbf{1}\bigl[h_b(\mathbf{x}) = \text{default}\bigr]$$

At each split only $m = \lfloor\sqrt{p}\rfloor$ randomly chosen features are considered
(`max_features='sqrt'`).

**Hyperparameters used:**

| Parameter | Impairment/ECL | Default Risk |
|-----------|---------------|--------------|
| `n_estimators` ($B$) | — | 200 |
| `max_depth` | — | 20 |
| `min_samples_split` | — | 5 |
| `min_samples_leaf` | — | 2 |
| `max_features` | — | `sqrt` |

**Reference:** `backend/Lasindu/main.py`, `backend/Kaveesha/randomforest.ipynb`

### 4.4 Gradient Boosting (XGBoost / LightGBM / CatBoost)

All three gradient boosting implementations share the same additive model structure. At
iteration $m$ the ensemble prediction is:

$$F_m(\mathbf{x}) = F_{m-1}(\mathbf{x}) + \eta \cdot h_m(\mathbf{x})$$

where $\eta$ is the learning rate and $h_m$ is the weak learner (shallow tree) fitted to
the negative gradient of the loss:

$$r_i^{(m)} = -\left[\frac{\partial \ell(y_i, F(\mathbf{x}_i))}{\partial F(\mathbf{x}_i)}\right]_{F = F_{m-1}}$$

**XGBoost objective** adds an explicit regularisation term $\Omega(f)$ per tree:

$$\mathcal{L}^{(m)} = \sum_{i=1}^{n} \ell\!\left(y_i,\, F_{m-1}(\mathbf{x}_i) + f_m(\mathbf{x}_i)\right) + \Omega(f_m)$$

$$\Omega(f) = \gamma \cdot T_{\text{leaves}} + \frac{1}{2} \lambda \sum_{j=1}^{T_{\text{leaves}}} w_j^2$$

where $T_{\text{leaves}}$ is the number of leaves, $w_j$ the leaf weights, $\gamma$ the
minimum loss reduction, and $\lambda$ the L2 weight regularisation.

**Hyperparameters (Default Risk module):**

| Framework | Trees | Max depth | Learning rate $\eta$ |
|-----------|-------|-----------|----------------------|
| CatBoost | 500 | 6 | 0.10 |
| XGBoost | 200 | 6 | 0.10 |
| LightGBM | — | — | — |

**Reference:** `backend/Kaveesha/XGBoost.ipynb`, `backend/Kaveesha/CatBoost_Gradient_Boosting.ipynb`,
`backend/Lasindu/use.ipynb`

### 4.5 Stacking Ensemble (Default Risk)

A two-level stacking scheme combines CatBoost, Random Forest, and XGBoost as base
learners with Logistic Regression as the meta-learner.

**Step 1 — Out-of-fold (OOF) base predictions** via $K = 5$ cross-validation:

For fold $k \in \{1,\ldots,K\}$ and base model $m \in \{\text{CB}, \text{RF}, \text{XGB}\}$:

$$\hat{z}_{i}^{(m)} = h_m^{(-k)}\!\left(\mathbf{x}_i\right), \quad i \in \text{fold } k$$

where $h_m^{(-k)}$ denotes model $m$ trained on all folds except $k$.

**Step 2 — Meta-feature matrix:**

$$Z = \bigl[\hat{z}^{(\text{CB})},\; \hat{z}^{(\text{RF})},\; \hat{z}^{(\text{XGB})}\bigr] \in \mathbb{R}^{n \times 3}$$

**Step 3 — Meta-learner prediction:**

$$\hat{P}_{\text{stack}}(\mathbf{x}) = \sigma\!\left(\gamma_0 + \gamma_1 \hat{z}^{(\text{CB})} + \gamma_2 \hat{z}^{(\text{RF})} + \gamma_3 \hat{z}^{(\text{XGB})}\right)$$

where $\{\gamma_j\}$ are learnt by the Logistic Regression meta-learner.

**Reference:** `backend/Kaveesha/stacking_ensemble_default_risk.ipynb`, `backend/Kaveesha/api.py`

### 4.6 R²-Weighted Hybrid Ensemble (Branch Performance)

Three base regressors — Random Forest (RF), XGBoost (XGB), CatBoost (CAT) — are
combined with weights proportional to their validation $R^2$ scores.

**Weight computation:**

$$w_m = \frac{R^2_m}{\displaystyle\sum_{m'} R^2_{m'}}, \quad m \in \{\text{RF},\, \text{XGB},\, \text{CAT}\}$$

**Ensemble prediction:**

$$\hat{y}_{\text{hybrid}}(\mathbf{x}) = w_{\text{RF}} \cdot \hat{y}_{\text{RF}}(\mathbf{x}) + w_{\text{XGB}} \cdot \hat{y}_{\text{XGB}}(\mathbf{x}) + w_{\text{CAT}} \cdot \hat{y}_{\text{CAT}}(\mathbf{x})$$

**Reference:** `backend/Manuji/Branch/main.py` — `hybrid_predict()`

---

## 5. Loss Functions

### 5.1 Binary Cross-Entropy (Log Loss)

Used by Logistic Regression, XGBoost (binary classification), and CatBoost:

$$\mathcal{L}_{\text{log}} = -\frac{1}{n}\sum_{i=1}^{n} \Bigl[y_i \log \hat{p}_i + (1 - y_i)\log(1 - \hat{p}_i)\Bigr]$$

where $y_i \in \{0, 1\}$ is the true label and $\hat{p}_i = \hat{P}(\text{default} \mid \mathbf{x}_i)$.

### 5.2 Mean Squared Error (MSE)

Used for regression targets (Impairment amount, 1-Year ECL):

$$\text{MSE} = \frac{1}{n}\sum_{i=1}^{n}\!\left(y_i - \hat{y}_i\right)^2$$

### 5.3 Root Mean Squared Error (RMSE)

$$\text{RMSE} = \sqrt{\text{MSE}} = \sqrt{\frac{1}{n}\sum_{i=1}^{n}\!\left(y_i - \hat{y}_i\right)^2}$$

---

## 6. Confidence Metric

A model-agreement confidence score is derived from the **coefficient of variation (CV)**
across multiple model predictions for the same input.

Let $\{\hat{y}_m\}_{m=1}^{M}$ be the predictions of the $M$ available models. Then:

$$\mu_{\hat{y}} = \frac{1}{M}\sum_{m=1}^{M} \hat{y}_m$$

$$\sigma_{\hat{y}} = \sqrt{\frac{1}{M}\sum_{m=1}^{M}\!\left(\hat{y}_m - \mu_{\hat{y}}\right)^2}$$

$$\text{CV} = \frac{\sigma_{\hat{y}}}{|\mu_{\hat{y}}| + \varepsilon}, \quad \varepsilon = 10^{-10}$$

$$\text{Confidence} = 100 \times \left(1 - \min(1,\, \text{CV})\right) \quad [\%]$$

A value of 100 % indicates perfect model agreement; 0 % indicates maximal disagreement.

**Reference:** `backend/Lasindu/main.py` — `_confidence()`

---

## 7. Risk Classification Rules

Predicted default probabilities $\hat{P}$ are mapped to business risk tiers:

$$\text{Risk Tier} = \begin{cases}
\text{High Risk} & \hat{P} \geq 0.80 \\
\text{Medium Risk} & 0.20 \leq \hat{P} < 0.80 \\
\text{Low Risk} & \hat{P} < 0.20
\end{cases}$$

**Reference:** `backend/Kaveesha/randomforest_model_performance_report.txt`

---

## 8. Evaluation Metrics

Let $\{(y_i, \hat{y}_i)\}_{i=1}^{n}$ denote the ground-truth and predicted labels.

### 8.1 Classification Metrics

**Confusion-matrix quantities:**

| | Predicted Positive | Predicted Negative |
|---|---|---|
| **Actual Positive** | TP | FN |
| **Actual Negative** | FP | TN |

$$\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}$$

$$\text{Precision} = \frac{TP}{TP + FP}$$

$$\text{Recall (Sensitivity)} = \frac{TP}{TP + FN}$$

$$F_1 = \frac{2 \times \text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

**ROC-AUC** — area under the Receiver Operating Characteristic curve:

$$\text{AUC} = \int_0^1 \text{TPR}\!\left(\text{FPR}^{-1}(t)\right) dt$$

where $\text{TPR} = TP/(TP+FN)$ and $\text{FPR} = FP/(FP+TN)$.

### 8.2 Regression Metrics

**Coefficient of Determination ($R^2$):**

$$R^2 = 1 - \frac{\displaystyle\sum_{i=1}^{n}(y_i - \hat{y}_i)^2}{\displaystyle\sum_{i=1}^{n}(y_i - \bar{y})^2}$$

where $\bar{y} = \frac{1}{n}\sum_{i=1}^{n} y_i$ is the mean of the observed values.

**Mean Absolute Error (MAE):**

$$\text{MAE} = \frac{1}{n}\sum_{i=1}^{n}|y_i - \hat{y}_i|$$

---

## 9. Model Performance Summary

### 9.1 Impairment & ECL Prediction (Regression)

| Model | Target | $R^2$ |
|-------|--------|--------|
| Random Forest | Impairment | 99.12 % |
| LightGBM | Impairment | 99.09 % |
| Stacking Ensemble | 1-Year ECL | 84.87 % |
| Random Forest | 1-Year ECL | 84.48 % |

### 9.2 Default Risk Prediction (Classification)

| Metric | Random Forest | Stacking Ensemble |
|--------|--------------|-------------------|
| Accuracy | 99.91 % | — |
| Precision | 99.89 % | — |
| Recall | 99.93 % | — |
| F1-Score | 99.91 % | — |
| Cross-Val Accuracy | 99.90 % ± 0.01 % | — |

### 9.3 Branch Performance (Regression, R²-weighted hybrid)

| Model | $R^2$ (validation) |
|-------|--------------------|
| Random Forest | > 80 % |
| XGBoost | > 80 % |
| CatBoost | > 80 % |
| **R²-Weighted Hybrid** | ≥ best base model |

Weights are computed as described in §4.6 and normalised so that $\sum_m w_m = 1$.

---

*All source files referenced above are located under the `backend/` directory of this repository.*
