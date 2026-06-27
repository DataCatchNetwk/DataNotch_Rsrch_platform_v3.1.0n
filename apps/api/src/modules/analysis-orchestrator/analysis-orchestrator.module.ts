/**
 * Analysis Orchestrator Module
 * Manages analysis runs, preprocessing, model training, and evaluation.
 * Enums mirror server/prisma/schema.prisma exactly.
 */
import { AnalysisRunStatus as PrismaAnalysisRunStatus, AnalysisRunType as PrismaAnalysisRunType, AnalysisAlgorithmType as PrismaAnalysisAlgorithmType, Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../utils/errors.js';

// ─── High-level run categories ──────────────────────────────────────────────

export enum AnalysisRunType {
  DESCRIPTIVE   = 'DESCRIPTIVE',
  REGRESSION    = 'REGRESSION',
  CLASSIFICATION = 'CLASSIFICATION',
  SURVIVAL      = 'SURVIVAL',
  CLUSTERING    = 'CLUSTERING',
  DIM_REDUCTION = 'DIM_REDUCTION',
  GENOMICS      = 'GENOMICS',
  CUSTOM        = 'CUSTOM',
}

// ─── Specific algorithm types (mirrors AnalysisAlgorithmType Prisma enum) ───

export enum AnalysisAlgorithmType {
  // Tree-based
  DECISION_TREE         = 'DECISION_TREE',
  RANDOM_FOREST         = 'RANDOM_FOREST',
  GRADIENT_BOOSTING     = 'GRADIENT_BOOSTING',
  XGBOOST               = 'XGBOOST',
  LIGHTGBM              = 'LIGHTGBM',
  CATBOOST              = 'CATBOOST',
  EXTRA_TREES           = 'EXTRA_TREES',
  ADABOOST              = 'ADABOOST',
  BAGGING               = 'BAGGING',

  // Neural Networks
  ANN_MLP               = 'ANN_MLP',
  CNN                   = 'CNN',
  RNN                   = 'RNN',
  LSTM                  = 'LSTM',
  GRU                   = 'GRU',
  TRANSFORMER           = 'TRANSFORMER',
  AUTOENCODER           = 'AUTOENCODER',

  // Bayesian
  NAIVE_BAYES           = 'NAIVE_BAYES',
  BAYESIAN_NETWORK      = 'BAYESIAN_NETWORK',
  GAUSSIAN_PROCESS      = 'GAUSSIAN_PROCESS',

  // Statistical / Linear
  LINEAR_REGRESSION     = 'LINEAR_REGRESSION',
  LOGISTIC_REGRESSION   = 'LOGISTIC_REGRESSION',
  RIDGE                 = 'RIDGE',
  LASSO                 = 'LASSO',
  ELASTIC_NET           = 'ELASTIC_NET',
  ANOVA                 = 'ANOVA',
  LINEAR_MIXED_MODELS   = 'LINEAR_MIXED_MODELS',
  POLYNOMIAL_REGRESSION = 'POLYNOMIAL_REGRESSION',

  // Support Vector
  SVM                   = 'SVM',
  SVR                   = 'SVR',

  // Nearest Neighbour
  KNN                   = 'KNN',

  // Clustering / Unsupervised
  K_MEANS               = 'K_MEANS',
  DBSCAN                = 'DBSCAN',
  HIERARCHICAL_CLUSTERING = 'HIERARCHICAL_CLUSTERING',
  GAUSSIAN_MIXTURE      = 'GAUSSIAN_MIXTURE',
  MEAN_SHIFT            = 'MEAN_SHIFT',
  SPECTRAL_CLUSTERING   = 'SPECTRAL_CLUSTERING',

  // Survival
  KAPLAN_MEIER          = 'KAPLAN_MEIER',
  COX_PH                = 'COX_PH',
  COMPETING_RISKS       = 'COMPETING_RISKS',
  RANDOM_SURVIVAL_FOREST = 'RANDOM_SURVIVAL_FOREST',
  WEIBULL_AFT           = 'WEIBULL_AFT',

  // Dimensionality Reduction
  PCA                   = 'PCA',
  UMAP                  = 'UMAP',
  TSNE                  = 'TSNE',
  NMF                   = 'NMF',
  ICA                   = 'ICA',
  FACTOR_ANALYSIS       = 'FACTOR_ANALYSIS',

  // Custom
  CUSTOM                = 'CUSTOM',
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export interface HyperparamDef {
  type: 'int' | 'float' | 'bool' | 'string' | 'enum';
  default: unknown;
  min?: number;
  max?: number;
  choices?: string[];
  description: string;
}

export interface AlgorithmMetadata {
  displayName: string;
  description: string;
  runType: AnalysisRunType;
  supportedTasks: Array<'binary_classification' | 'multiclass' | 'regression' | 'clustering' | 'survival' | 'dim_reduction' | 'anomaly_detection' | 'generation'>;
  hyperparams: Record<string, HyperparamDef>;
}

// ─── Algorithm catalog ────────────────────────────────────────────────────────

export const ALGORITHM_CATALOG: Record<AnalysisAlgorithmType, AlgorithmMetadata> = {

  // ── Tree-based ──────────────────────────────────────────────────────────────

  [AnalysisAlgorithmType.DECISION_TREE]: {
    displayName: 'Decision Tree',
    description: 'Axis-aligned decision tree using CART criterion.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression'],
    hyperparams: {
      max_depth:          { type: 'int',   default: null,  min: 1,  max: 100, description: 'Maximum depth of the tree (null = unlimited)' },
      min_samples_split:  { type: 'int',   default: 2,     min: 2,           description: 'Minimum samples to split an internal node' },
      min_samples_leaf:   { type: 'int',   default: 1,     min: 1,           description: 'Minimum samples required at a leaf node' },
      criterion:          { type: 'enum',  default: 'gini', choices: ['gini', 'entropy', 'log_loss', 'squared_error', 'friedman_mse'], description: 'Impurity criterion' },
      max_features:       { type: 'enum',  default: null,  choices: ['sqrt', 'log2', 'auto'],  description: 'Max features considered per split' },
    },
  },

  [AnalysisAlgorithmType.RANDOM_FOREST]: {
    displayName: 'Random Forest',
    description: 'Ensemble of decision trees using bootstrap aggregation.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression'],
    hyperparams: {
      n_estimators:       { type: 'int',   default: 100,  min: 10, max: 5000, description: 'Number of trees in the forest' },
      max_depth:          { type: 'int',   default: null, min: 1,  max: 100,  description: 'Maximum tree depth' },
      max_features:       { type: 'enum',  default: 'sqrt', choices: ['sqrt', 'log2', 'auto'], description: 'Max features per split' },
      min_samples_leaf:   { type: 'int',   default: 1,    min: 1,             description: 'Minimum samples at leaf' },
      bootstrap:          { type: 'bool',  default: true,                     description: 'Use bootstrap sampling' },
    },
  },

  [AnalysisAlgorithmType.GRADIENT_BOOSTING]: {
    displayName: 'Gradient Boosting',
    description: 'Sequential ensemble that corrects residuals via gradient descent.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression'],
    hyperparams: {
      n_estimators:       { type: 'int',   default: 100,  min: 10,  max: 5000, description: 'Number of boosting rounds' },
      learning_rate:      { type: 'float', default: 0.1,  min: 1e-4, max: 1.0,  description: 'Shrinkage rate applied to each tree' },
      max_depth:          { type: 'int',   default: 3,    min: 1,   max: 20,   description: 'Maximum tree depth' },
      subsample:          { type: 'float', default: 1.0,  min: 0.1, max: 1.0,  description: 'Fraction of samples used per tree' },
      min_samples_leaf:   { type: 'int',   default: 1,    min: 1,              description: 'Minimum samples at leaf node' },
    },
  },

  [AnalysisAlgorithmType.XGBOOST]: {
    displayName: 'XGBoost',
    description: 'Extreme Gradient Boosting — highly optimised parallel GBDT.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression'],
    hyperparams: {
      n_estimators:       { type: 'int',   default: 100,  min: 10,    max: 5000, description: 'Number of boosting rounds' },
      learning_rate:      { type: 'float', default: 0.1,  min: 1e-4,  max: 1.0,  description: 'Step size shrinkage (eta)' },
      max_depth:          { type: 'int',   default: 6,    min: 1,     max: 20,   description: 'Maximum tree depth' },
      subsample:          { type: 'float', default: 1.0,  min: 0.1,   max: 1.0,  description: 'Row sampling ratio' },
      colsample_bytree:   { type: 'float', default: 1.0,  min: 0.1,   max: 1.0,  description: 'Column sampling ratio per tree' },
      reg_alpha:          { type: 'float', default: 0.0,  min: 0.0,              description: 'L1 regularisation term' },
      reg_lambda:         { type: 'float', default: 1.0,  min: 0.0,              description: 'L2 regularisation term' },
    },
  },

  [AnalysisAlgorithmType.LIGHTGBM]: {
    displayName: 'LightGBM',
    description: 'Gradient boosting using leaf-wise growth with histogram-based splits.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression'],
    hyperparams: {
      n_estimators:       { type: 'int',   default: 100,  min: 10,   max: 5000, description: 'Number of boosting iterations' },
      learning_rate:      { type: 'float', default: 0.1,  min: 1e-4, max: 1.0,  description: 'Learning rate' },
      num_leaves:         { type: 'int',   default: 31,   min: 2,    max: 512,  description: 'Maximum leaves per tree' },
      max_depth:          { type: 'int',   default: -1,   min: -1,              description: '-1 means no limit' },
      min_child_samples:  { type: 'int',   default: 20,   min: 1,               description: 'Minimum data in one leaf' },
      lambda_l1:          { type: 'float', default: 0.0,  min: 0.0,             description: 'L1 regularisation' },
      lambda_l2:          { type: 'float', default: 0.0,  min: 0.0,             description: 'L2 regularisation' },
    },
  },

  [AnalysisAlgorithmType.CATBOOST]: {
    displayName: 'CatBoost',
    description: 'Gradient boosting with native categorical feature support.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression'],
    hyperparams: {
      iterations:         { type: 'int',   default: 500,  min: 10,   max: 5000, description: 'Number of trees' },
      learning_rate:      { type: 'float', default: 0.03, min: 1e-4, max: 1.0,  description: 'Step size for gradient update' },
      depth:              { type: 'int',   default: 6,    min: 1,    max: 16,   description: 'Tree depth' },
      l2_leaf_reg:        { type: 'float', default: 3.0,  min: 0.0,             description: 'L2 regularisation coefficient' },
      border_count:       { type: 'int',   default: 254,  min: 1,    max: 1024, description: 'Quantisation border count for floats' },
    },
  },

  [AnalysisAlgorithmType.EXTRA_TREES]: {
    displayName: 'Extra Trees',
    description: 'Extremely randomised trees — faster than Random Forest, lower variance.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression'],
    hyperparams: {
      n_estimators:       { type: 'int',   default: 100, min: 10, max: 5000, description: 'Number of trees' },
      max_depth:          { type: 'int',   default: null, min: 1, max: 100,  description: 'Tree depth (null = unlimited)' },
      min_samples_split:  { type: 'int',   default: 2,   min: 2,            description: 'Minimum samples to split' },
    },
  },

  [AnalysisAlgorithmType.ADABOOST]: {
    displayName: 'AdaBoost',
    description: 'Adaptive boosting — reweights misclassified samples each round.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression'],
    hyperparams: {
      n_estimators:       { type: 'int',   default: 50,  min: 10, max: 500, description: 'Number of estimators' },
      learning_rate:      { type: 'float', default: 1.0, min: 0.01, max: 2.0, description: 'Weight applied to each estimator' },
      algorithm:          { type: 'enum',  default: 'SAMME.R', choices: ['SAMME', 'SAMME.R'], description: 'Boosting algorithm variant' },
    },
  },

  [AnalysisAlgorithmType.BAGGING]: {
    displayName: 'Bagging Ensemble',
    description: 'Bootstrap aggregation of a base estimator.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression'],
    hyperparams: {
      n_estimators:       { type: 'int',   default: 10,  min: 2,  max: 500, description: 'Number of base estimators' },
      max_samples:        { type: 'float', default: 1.0, min: 0.1, max: 1.0, description: 'Fraction of samples per estimator' },
      max_features:       { type: 'float', default: 1.0, min: 0.1, max: 1.0, description: 'Fraction of features per estimator' },
      bootstrap:          { type: 'bool',  default: true,           description: 'Sample with replacement' },
    },
  },

  // ── Neural Networks ──────────────────────────────────────────────────────────

  [AnalysisAlgorithmType.ANN_MLP]: {
    displayName: 'ANN / MLP',
    description: 'Fully-connected artificial neural network (multi-layer perceptron).',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression'],
    hyperparams: {
      hidden_layers:      { type: 'string', default: '[128,64]',  description: 'JSON array of neuron counts per hidden layer' },
      activation:         { type: 'enum',   default: 'relu',      choices: ['relu', 'tanh', 'sigmoid', 'elu', 'selu', 'gelu'], description: 'Hidden layer activation function' },
      optimizer:          { type: 'enum',   default: 'adam',      choices: ['adam', 'sgd', 'rmsprop', 'adamw'], description: 'Optimisation algorithm' },
      learning_rate:      { type: 'float',  default: 0.001, min: 1e-6, max: 1.0, description: 'Learning rate' },
      epochs:             { type: 'int',    default: 100,   min: 1,  max: 10000, description: 'Training epochs' },
      batch_size:         { type: 'int',    default: 32,    min: 1,  max: 4096,  description: 'Mini-batch size' },
      dropout_rate:       { type: 'float',  default: 0.0,   min: 0.0, max: 0.9,  description: 'Dropout probability per layer' },
      l2_reg:             { type: 'float',  default: 0.0,   min: 0.0,            description: 'L2 weight regularisation' },
    },
  },

  [AnalysisAlgorithmType.CNN]: {
    displayName: 'CNN',
    description: 'Convolutional neural network for structured/image/sequence data.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression'],
    hyperparams: {
      conv_filters:       { type: 'string', default: '[32,64]', description: 'Filters per Conv layer (JSON array)' },
      kernel_size:        { type: 'int',    default: 3,  min: 1, max: 31,  description: 'Convolution kernel size' },
      pool_size:          { type: 'int',    default: 2,  min: 1, max: 8,   description: 'Max-pooling window size' },
      dense_units:        { type: 'int',    default: 128, min: 8, max: 4096, description: 'Fully-connected head units' },
      activation:         { type: 'enum',  default: 'relu', choices: ['relu', 'tanh', 'elu', 'gelu'], description: 'Activation function' },
      learning_rate:      { type: 'float', default: 0.001, min: 1e-6, max: 1.0, description: 'Learning rate' },
      epochs:             { type: 'int',   default: 50,  min: 1, max: 10000, description: 'Training epochs' },
      batch_size:         { type: 'int',   default: 32,  min: 1, max: 2048, description: 'Mini-batch size' },
      dropout_rate:       { type: 'float', default: 0.25, min: 0.0, max: 0.9, description: 'Dropout rate after pooling layers' },
    },
  },

  [AnalysisAlgorithmType.RNN]: {
    displayName: 'RNN',
    description: 'Vanilla recurrent neural network for sequential data.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression'],
    hyperparams: {
      hidden_units:       { type: 'int',   default: 64,   min: 8,  max: 1024, description: 'RNN hidden state size' },
      num_layers:         { type: 'int',   default: 1,    min: 1,  max: 8,    description: 'Number of stacked RNN layers' },
      learning_rate:      { type: 'float', default: 0.001, min: 1e-6, max: 1.0, description: 'Learning rate' },
      epochs:             { type: 'int',   default: 50,   min: 1,  max: 10000, description: 'Training epochs' },
      batch_size:         { type: 'int',   default: 32,   min: 1,  max: 2048, description: 'Mini-batch size' },
      dropout_rate:       { type: 'float', default: 0.0,  min: 0.0, max: 0.9, description: 'Recurrent dropout' },
      bidirectional:      { type: 'bool',  default: false, description: 'Use bidirectional wrapper' },
    },
  },

  [AnalysisAlgorithmType.LSTM]: {
    displayName: 'LSTM',
    description: 'Long Short-Term Memory network — learns long-range sequential dependencies.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression'],
    hyperparams: {
      hidden_units:       { type: 'int',   default: 128,  min: 8,  max: 2048, description: 'LSTM cell hidden units' },
      num_layers:         { type: 'int',   default: 1,    min: 1,  max: 8,    description: 'Stacked LSTM layers' },
      learning_rate:      { type: 'float', default: 0.001, min: 1e-6, max: 1.0, description: 'Learning rate' },
      epochs:             { type: 'int',   default: 100,  min: 1,  max: 10000, description: 'Training epochs' },
      batch_size:         { type: 'int',   default: 32,   min: 1,  max: 2048, description: 'Mini-batch size' },
      dropout_rate:       { type: 'float', default: 0.0,  min: 0.0, max: 0.9, description: 'Input/output dropout' },
      recurrent_dropout:  { type: 'float', default: 0.0,  min: 0.0, max: 0.9, description: 'Recurrent state dropout' },
      bidirectional:      { type: 'bool',  default: false, description: 'Bidirectional LSTM' },
    },
  },

  [AnalysisAlgorithmType.GRU]: {
    displayName: 'GRU',
    description: 'Gated Recurrent Unit — lighter alternative to LSTM with comparable performance.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression'],
    hyperparams: {
      hidden_units:       { type: 'int',   default: 128,  min: 8,  max: 2048, description: 'GRU hidden units' },
      num_layers:         { type: 'int',   default: 1,    min: 1,  max: 8,    description: 'Stacked GRU layers' },
      learning_rate:      { type: 'float', default: 0.001, min: 1e-6, max: 1.0, description: 'Learning rate' },
      epochs:             { type: 'int',   default: 100,  min: 1,  max: 10000, description: 'Training epochs' },
      batch_size:         { type: 'int',   default: 32,   min: 1,  max: 2048, description: 'Mini-batch size' },
      dropout_rate:       { type: 'float', default: 0.0,  min: 0.0, max: 0.9, description: 'Dropout rate' },
      bidirectional:      { type: 'bool',  default: false, description: 'Bidirectional GRU' },
    },
  },

  [AnalysisAlgorithmType.TRANSFORMER]: {
    displayName: 'Transformer',
    description: 'Self-attention based architecture (encoder/decoder or encoder-only).',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression', 'generation'],
    hyperparams: {
      d_model:            { type: 'int',   default: 128,  min: 16,  max: 4096, description: 'Model / embedding dimension' },
      num_heads:          { type: 'int',   default: 4,    min: 1,   max: 64,   description: 'Number of attention heads (d_model divisible)' },
      num_layers:         { type: 'int',   default: 4,    min: 1,   max: 48,   description: 'Encoder/decoder layers' },
      ffn_dim:            { type: 'int',   default: 512,  min: 64,  max: 8192, description: 'Feed-forward sub-layer dimension' },
      dropout_rate:       { type: 'float', default: 0.1,  min: 0.0, max: 0.5,  description: 'Dropout throughout the model' },
      learning_rate:      { type: 'float', default: 1e-4, min: 1e-7, max: 1.0, description: 'Learning rate' },
      epochs:             { type: 'int',   default: 50,   min: 1,  max: 10000, description: 'Training epochs' },
      batch_size:         { type: 'int',   default: 16,   min: 1,  max: 2048,  description: 'Mini-batch size' },
      max_seq_len:        { type: 'int',   default: 512,  min: 8,  max: 65536, description: 'Maximum input sequence length' },
    },
  },

  [AnalysisAlgorithmType.AUTOENCODER]: {
    displayName: 'Autoencoder',
    description: 'Encoder-decoder network for representation learning and anomaly detection.',
    runType: AnalysisRunType.DIM_REDUCTION,
    supportedTasks: ['dim_reduction', 'anomaly_detection', 'generation'],
    hyperparams: {
      latent_dim:         { type: 'int',   default: 32,   min: 2,  max: 2048, description: 'Dimensionality of bottleneck (latent) layer' },
      encoder_layers:     { type: 'string', default: '[128,64]', description: 'Encoder layer sizes (JSON array)' },
      activation:         { type: 'enum',  default: 'relu', choices: ['relu', 'tanh', 'leaky_relu', 'elu'], description: 'Activation function' },
      learning_rate:      { type: 'float', default: 0.001, min: 1e-6, max: 1.0, description: 'Learning rate' },
      epochs:             { type: 'int',   default: 100,  min: 1,  max: 10000, description: 'Training epochs' },
      batch_size:         { type: 'int',   default: 64,   min: 1,  max: 4096, description: 'Mini-batch size' },
      variational:        { type: 'bool',  default: false, description: 'Variational AE (VAE) with KL divergence loss' },
    },
  },

  // ── Bayesian ─────────────────────────────────────────────────────────────────

  [AnalysisAlgorithmType.NAIVE_BAYES]: {
    displayName: 'Naïve Bayes',
    description: 'Probabilistic classifier assuming feature independence.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass'],
    hyperparams: {
      variant:            { type: 'enum', default: 'gaussian', choices: ['gaussian', 'multinomial', 'bernoulli', 'complement'], description: 'NB variant to use' },
      var_smoothing:      { type: 'float', default: 1e-9, min: 1e-12, max: 1.0, description: 'Portion of variance added for stability (GaussianNB)' },
    },
  },

  [AnalysisAlgorithmType.BAYESIAN_NETWORK]: {
    displayName: 'Bayesian Network',
    description: 'Directed acyclic graphical model representing conditional dependencies.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass'],
    hyperparams: {
      structure_learning: { type: 'enum',  default: 'hill_climbing', choices: ['hill_climbing', 'pc', 'mmhc', 'fixed'], description: 'Structure learning algorithm' },
      scoring_method:     { type: 'enum',  default: 'BIC', choices: ['BIC', 'AIC', 'K2', 'BDeu'], description: 'Scoring metric for structure learning' },
      max_parents:        { type: 'int',   default: 4,    min: 1,  max: 20, description: 'Maximum parents per node' },
      n_samples:          { type: 'int',   default: 1000, min: 100, max: 100000, description: 'Posterior samples for inference' },
    },
  },

  [AnalysisAlgorithmType.GAUSSIAN_PROCESS]: {
    displayName: 'Gaussian Process',
    description: 'Non-parametric Bayesian model providing uncertainty estimates.',
    runType: AnalysisRunType.REGRESSION,
    supportedTasks: ['binary_classification', 'regression'],
    hyperparams: {
      kernel:             { type: 'enum',  default: 'rbf', choices: ['rbf', 'matern', 'rational_quadratic', 'expsin_squared', 'dot_product'], description: 'Kernel (covariance) function' },
      n_restarts_optimizer: { type: 'int', default: 5,  min: 0, max: 50, description: 'Restarts for kernel hyperparameter optimisation' },
      alpha:              { type: 'float', default: 1e-10, min: 1e-14, max: 1e-2, description: 'Noise level regularisation' },
      normalize_y:        { type: 'bool',  default: true, description: 'Normalise target values' },
    },
  },

  // ── Statistical / Linear ──────────────────────────────────────────────────────

  [AnalysisAlgorithmType.LINEAR_REGRESSION]: {
    displayName: 'Linear Regression',
    description: 'Ordinary least-squares regression.',
    runType: AnalysisRunType.REGRESSION,
    supportedTasks: ['regression'],
    hyperparams: {
      fit_intercept:      { type: 'bool',  default: true,  description: 'Fit an intercept term' },
      normalize:          { type: 'bool',  default: false, description: 'Normalise regressors before fitting' },
    },
  },

  [AnalysisAlgorithmType.LOGISTIC_REGRESSION]: {
    displayName: 'Logistic Regression',
    description: 'Log-linear classifier with tunable regularisation.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass'],
    hyperparams: {
      C:                  { type: 'float', default: 1.0,   min: 1e-6, max: 1e6, description: 'Inverse regularisation strength' },
      penalty:            { type: 'enum',  default: 'l2',  choices: ['l1', 'l2', 'elasticnet', 'none'], description: 'Regularisation norm' },
      solver:             { type: 'enum',  default: 'lbfgs', choices: ['lbfgs', 'liblinear', 'newton-cg', 'newton-cholesky', 'sag', 'saga'], description: 'Solver algorithm' },
      max_iter:           { type: 'int',   default: 200,   min: 50,  max: 10000, description: 'Maximum solver iterations' },
      multi_class:        { type: 'enum',  default: 'auto', choices: ['auto', 'ovr', 'multinomial'], description: 'Multi-class strategy' },
    },
  },

  [AnalysisAlgorithmType.RIDGE]: {
    displayName: 'Ridge Regression',
    description: 'L2-regularised linear regression.',
    runType: AnalysisRunType.REGRESSION,
    supportedTasks: ['regression'],
    hyperparams: {
      alpha:              { type: 'float', default: 1.0, min: 0.0, description: 'L2 regularisation strength' },
      fit_intercept:      { type: 'bool',  default: true, description: 'Fit an intercept' },
      solver:             { type: 'enum',  default: 'auto', choices: ['auto', 'svd', 'cholesky', 'lsqr', 'sparse_cg', 'sag', 'saga'], description: 'Solver type' },
    },
  },

  [AnalysisAlgorithmType.LASSO]: {
    displayName: 'Lasso Regression',
    description: 'L1-regularised regression with built-in feature selection.',
    runType: AnalysisRunType.REGRESSION,
    supportedTasks: ['regression'],
    hyperparams: {
      alpha:              { type: 'float', default: 1.0,  min: 0.0, description: 'L1 regularisation strength' },
      max_iter:           { type: 'int',   default: 1000, min: 100, description: 'Maximum iterations' },
      fit_intercept:      { type: 'bool',  default: true, description: 'Fit an intercept' },
      warm_start:         { type: 'bool',  default: false, description: 'Reuse previous solution for fit initialisation' },
    },
  },

  [AnalysisAlgorithmType.ELASTIC_NET]: {
    displayName: 'Elastic Net',
    description: 'Combined L1+L2 regularisation for correlated feature sets.',
    runType: AnalysisRunType.REGRESSION,
    supportedTasks: ['regression'],
    hyperparams: {
      alpha:              { type: 'float', default: 1.0,  min: 0.0, description: 'Overall regularisation strength' },
      l1_ratio:           { type: 'float', default: 0.5,  min: 0.0, max: 1.0, description: 'Ratio of L1 vs L2 penalty (0=Ridge, 1=Lasso)' },
      max_iter:           { type: 'int',   default: 1000, min: 100, description: 'Maximum iterations' },
    },
  },

  [AnalysisAlgorithmType.ANOVA]: {
    displayName: 'ANOVA',
    description: 'Analysis of Variance — tests mean differences across groups.',
    runType: AnalysisRunType.DESCRIPTIVE,
    supportedTasks: ['regression'],
    hyperparams: {
      test_type:          { type: 'enum',  default: 'one_way', choices: ['one_way', 'two_way', 'repeated_measures', 'manova'], description: 'ANOVA variant' },
      alpha:              { type: 'float', default: 0.05, min: 0.001, max: 0.2, description: 'Significance level' },
      post_hoc:           { type: 'enum',  default: 'tukey', choices: ['tukey', 'bonferroni', 'scheffe', 'none'], description: 'Post-hoc correction method' },
    },
  },

  [AnalysisAlgorithmType.LINEAR_MIXED_MODELS]: {
    displayName: 'Linear Mixed Models',
    description: 'Mixed effects models for clustered / longitudinal data.',
    runType: AnalysisRunType.REGRESSION,
    supportedTasks: ['regression'],
    hyperparams: {
      reml:               { type: 'bool',  default: true,  description: 'Use REML estimation (false = ML)' },
      optimizer:          { type: 'enum',  default: 'lbfgs', choices: ['lbfgs', 'bfgs', 'nm', 'cg'], description: 'Likelihood optimisation method' },
      max_iter:           { type: 'int',   default: 100,   min: 10, max: 2000, description: 'Maximum optimiser iterations' },
    },
  },

  [AnalysisAlgorithmType.POLYNOMIAL_REGRESSION]: {
    displayName: 'Polynomial Regression',
    description: 'Linear regression on polynomial feature expansions.',
    runType: AnalysisRunType.REGRESSION,
    supportedTasks: ['regression'],
    hyperparams: {
      degree:             { type: 'int',   default: 2, min: 2, max: 10, description: 'Polynomial degree' },
      interaction_only:   { type: 'bool',  default: false, description: 'Include only interaction features' },
      include_bias:       { type: 'bool',  default: true,  description: 'Include bias (constant) column' },
    },
  },

  // ── Support Vector ────────────────────────────────────────────────────────────

  [AnalysisAlgorithmType.SVM]: {
    displayName: 'SVM',
    description: 'Support Vector Machine classifier with kernel trick.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass'],
    hyperparams: {
      kernel:             { type: 'enum',  default: 'rbf',  choices: ['linear', 'poly', 'rbf', 'sigmoid'], description: 'Kernel function' },
      C:                  { type: 'float', default: 1.0,    min: 1e-4, max: 1e6, description: 'Regularisation parameter' },
      gamma:              { type: 'enum',  default: 'scale', choices: ['scale', 'auto'], description: 'Kernel coefficient' },
      degree:             { type: 'int',   default: 3,      min: 1,  max: 10,   description: 'Degree for poly kernel' },
      max_iter:           { type: 'int',   default: -1,     description: '-1 = no limit on solver iterations' },
    },
  },

  [AnalysisAlgorithmType.SVR]: {
    displayName: 'SVR',
    description: 'Support Vector Regression.',
    runType: AnalysisRunType.REGRESSION,
    supportedTasks: ['regression'],
    hyperparams: {
      kernel:             { type: 'enum',  default: 'rbf', choices: ['linear', 'poly', 'rbf', 'sigmoid'], description: 'Kernel function' },
      C:                  { type: 'float', default: 1.0,   min: 1e-4, max: 1e6, description: 'Regularisation parameter' },
      epsilon:            { type: 'float', default: 0.1,   min: 0.0,            description: 'Insensitive tube width' },
      gamma:              { type: 'enum',  default: 'scale', choices: ['scale', 'auto'], description: 'Kernel coefficient' },
    },
  },

  // ── Nearest Neighbour ─────────────────────────────────────────────────────────

  [AnalysisAlgorithmType.KNN]: {
    displayName: 'K-Nearest Neighbours',
    description: 'Non-parametric classifier / regressor based on feature-space proximity.',
    runType: AnalysisRunType.CLASSIFICATION,
    supportedTasks: ['binary_classification', 'multiclass', 'regression'],
    hyperparams: {
      n_neighbors:        { type: 'int',   default: 5,    min: 1,  max: 1000, description: 'Number of neighbours k' },
      weights:            { type: 'enum',  default: 'uniform', choices: ['uniform', 'distance'], description: 'Neighbour weighting scheme' },
      metric:             { type: 'enum',  default: 'minkowski', choices: ['euclidean', 'manhattan', 'minkowski', 'cosine', 'chebyshev'], description: 'Distance metric' },
      p:                  { type: 'int',   default: 2,    min: 1,  max: 10,   description: 'Power for Minkowski metric (1=Manhattan, 2=Euclidean)' },
    },
  },

  // ── Clustering / Unsupervised ──────────────────────────────────────────────────

  [AnalysisAlgorithmType.K_MEANS]: {
    displayName: 'K-Means',
    description: 'Centroid-based flat clustering algorithm.',
    runType: AnalysisRunType.CLUSTERING,
    supportedTasks: ['clustering'],
    hyperparams: {
      n_clusters:         { type: 'int',   default: 8,    min: 2,  max: 1000, description: 'Number of clusters k' },
      init:               { type: 'enum',  default: 'k-means++', choices: ['k-means++', 'random'], description: 'Centroid initialisation' },
      max_iter:           { type: 'int',   default: 300,  min: 10, max: 10000, description: 'Maximum iterations per run' },
      n_init:             { type: 'int',   default: 10,   min: 1,  max: 100,   description: 'Number of initialisations' },
    },
  },

  [AnalysisAlgorithmType.DBSCAN]: {
    displayName: 'DBSCAN',
    description: 'Density-based clustering — identifies arbitrarily shaped clusters and noise.',
    runType: AnalysisRunType.CLUSTERING,
    supportedTasks: ['clustering', 'anomaly_detection'],
    hyperparams: {
      eps:                { type: 'float', default: 0.5,  min: 0.01, description: 'Maximum radius of neighbourhood' },
      min_samples:        { type: 'int',   default: 5,    min: 1,    description: 'Minimum points in a core neighbourhood' },
      metric:             { type: 'enum',  default: 'euclidean', choices: ['euclidean', 'manhattan', 'cosine', 'precomputed'], description: 'Distance metric' },
    },
  },

  [AnalysisAlgorithmType.HIERARCHICAL_CLUSTERING]: {
    displayName: 'Hierarchical Clustering',
    description: 'Agglomerative hierarchical clustering with dendrogram output.',
    runType: AnalysisRunType.CLUSTERING,
    supportedTasks: ['clustering'],
    hyperparams: {
      n_clusters:         { type: 'int',   default: 4,    min: 2,  max: 1000, description: 'Target number of clusters' },
      linkage:            { type: 'enum',  default: 'ward', choices: ['ward', 'complete', 'average', 'single'], description: 'Linkage criterion' },
      metric:             { type: 'enum',  default: 'euclidean', choices: ['euclidean', 'manhattan', 'cosine'], description: 'Distance metric (ward requires euclidean)' },
    },
  },

  [AnalysisAlgorithmType.GAUSSIAN_MIXTURE]: {
    displayName: 'Gaussian Mixture Model',
    description: 'Soft probabilistic assignment using a mixture of Gaussians (EM).',
    runType: AnalysisRunType.CLUSTERING,
    supportedTasks: ['clustering', 'anomaly_detection'],
    hyperparams: {
      n_components:       { type: 'int',   default: 4,    min: 1,  max: 100, description: 'Number of mixture components' },
      covariance_type:    { type: 'enum',  default: 'full', choices: ['full', 'tied', 'diag', 'spherical'], description: 'Covariance matrix structure' },
      max_iter:           { type: 'int',   default: 100,  min: 10, max: 10000, description: 'EM iterations' },
      n_init:             { type: 'int',   default: 1,    min: 1,  max: 20,    description: 'EM initialisations' },
    },
  },

  [AnalysisAlgorithmType.MEAN_SHIFT]: {
    displayName: 'Mean Shift',
    description: 'Bandwidth-based centroid clustering — number of clusters inferred automatically.',
    runType: AnalysisRunType.CLUSTERING,
    supportedTasks: ['clustering'],
    hyperparams: {
      bandwidth:          { type: 'float', default: null, description: 'Kernel bandwidth (null = estimated from data)' },
      max_iter:           { type: 'int',   default: 300,  min: 50, max: 10000, description: 'Maximum iterations' },
    },
  },

  [AnalysisAlgorithmType.SPECTRAL_CLUSTERING]: {
    displayName: 'Spectral Clustering',
    description: 'Graph Laplacian based clustering in low-dimensional spectral space.',
    runType: AnalysisRunType.CLUSTERING,
    supportedTasks: ['clustering'],
    hyperparams: {
      n_clusters:         { type: 'int',   default: 4,    min: 2, max: 1000, description: 'Target number of clusters' },
      affinity:           { type: 'enum',  default: 'rbf', choices: ['rbf', 'nearest_neighbors', 'precomputed'], description: 'Affinity matrix construction' },
      n_neighbors:        { type: 'int',   default: 10,   min: 2, max: 100,  description: 'Neighbours for kNN affinity' },
      assign_labels:      { type: 'enum',  default: 'kmeans', choices: ['kmeans', 'discretize', 'cluster_qr'], description: 'Label assignment strategy' },
    },
  },

  // ── Survival ──────────────────────────────────────────────────────────────────

  [AnalysisAlgorithmType.KAPLAN_MEIER]: {
    displayName: 'Kaplan-Meier',
    description: 'Non-parametric estimator of the survival function from censored data.',
    runType: AnalysisRunType.SURVIVAL,
    supportedTasks: ['survival'],
    hyperparams: {
      confidence_type:    { type: 'enum',  default: 'log-log', choices: ['plain', 'log', 'log-log', 'logit'], description: 'Confidence interval transform' },
      confidence_level:   { type: 'float', default: 0.95, min: 0.5, max: 0.999, description: 'CI coverage probability' },
    },
  },

  [AnalysisAlgorithmType.COX_PH]: {
    displayName: 'Cox Proportional Hazards',
    description: 'Semi-parametric hazard regression model with covariate adjustments.',
    runType: AnalysisRunType.SURVIVAL,
    supportedTasks: ['survival'],
    hyperparams: {
      ties:               { type: 'enum',  default: 'efron', choices: ['breslow', 'efron', 'exact'], description: 'Method for handling tied event times' },
      alpha:              { type: 'float', default: 0.05, min: 0.001, max: 0.2, description: 'Significance level for p-values' },
      penalizer:          { type: 'float', default: 0.0,  min: 0.0,              description: 'Ridge penalty on coefficients' },
    },
  },

  [AnalysisAlgorithmType.COMPETING_RISKS]: {
    displayName: 'Competing Risks',
    description: 'Cause-specific hazard and cumulative incidence with competing events.',
    runType: AnalysisRunType.SURVIVAL,
    supportedTasks: ['survival'],
    hyperparams: {
      model_type:         { type: 'enum',  default: 'fine_gray', choices: ['fine_gray', 'cause_specific_cox'], description: 'Competing risk regression type' },
      alpha:              { type: 'float', default: 0.05, min: 0.001, max: 0.2, description: 'Significance level' },
    },
  },

  [AnalysisAlgorithmType.RANDOM_SURVIVAL_FOREST]: {
    displayName: 'Random Survival Forest',
    description: 'Ensemble survival analysis combining Random Forest with log-rank splitting.',
    runType: AnalysisRunType.SURVIVAL,
    supportedTasks: ['survival'],
    hyperparams: {
      n_estimators:       { type: 'int',   default: 100,  min: 10,  max: 5000, description: 'Number of survival trees' },
      max_depth:          { type: 'int',   default: null, min: 1,   max: 100,  description: 'Max tree depth (null = unlimited)' },
      min_samples_split:  { type: 'int',   default: 6,    min: 2,              description: 'Minimum samples to split a node' },
      min_samples_leaf:   { type: 'int',   default: 3,    min: 1,              description: 'Minimum samples at a leaf' },
      max_features:       { type: 'enum',  default: 'sqrt', choices: ['sqrt', 'log2', 'auto'], description: 'Features per split' },
    },
  },

  [AnalysisAlgorithmType.WEIBULL_AFT]: {
    displayName: 'Weibull AFT',
    description: 'Parametric Accelerated Failure Time model with Weibull distribution.',
    runType: AnalysisRunType.SURVIVAL,
    supportedTasks: ['survival'],
    hyperparams: {
      penalizer:          { type: 'float', default: 0.0,  min: 0.0,              description: 'Ridge penalisation coefficient' },
      alpha:              { type: 'float', default: 0.05, min: 0.001, max: 0.2,  description: 'Significance level' },
      fit_intercept:      { type: 'bool',  default: true, description: 'Include intercept in the linear predictor' },
    },
  },

  // ── Dimensionality Reduction ──────────────────────────────────────────────────

  [AnalysisAlgorithmType.PCA]: {
    displayName: 'PCA',
    description: 'Principal Component Analysis — linear orthogonal projection onto variance directions.',
    runType: AnalysisRunType.DIM_REDUCTION,
    supportedTasks: ['dim_reduction'],
    hyperparams: {
      n_components:       { type: 'int',   default: null, min: 1, description: 'Number of principal components (null = min(n_samples, n_features))' },
      whiten:             { type: 'bool',  default: false, description: 'Whiten components to unit variance' },
      svd_solver:         { type: 'enum',  default: 'auto', choices: ['auto', 'full', 'arpack', 'randomized'], description: 'SVD solver' },
    },
  },

  [AnalysisAlgorithmType.UMAP]: {
    displayName: 'UMAP',
    description: 'Uniform Manifold Approximation and Projection — non-linear dimensionality reduction.',
    runType: AnalysisRunType.DIM_REDUCTION,
    supportedTasks: ['dim_reduction', 'clustering'],
    hyperparams: {
      n_components:       { type: 'int',   default: 2,    min: 1,  max: 100,  description: 'Target embedding dimension' },
      n_neighbors:        { type: 'int',   default: 15,   min: 2,  max: 500,  description: 'Local neighbourhood size' },
      min_dist:           { type: 'float', default: 0.1,  min: 0.0, max: 1.0, description: 'Minimum distance in embedding' },
      metric:             { type: 'enum',  default: 'euclidean', choices: ['euclidean', 'manhattan', 'cosine', 'correlation'], description: 'Input space metric' },
    },
  },

  [AnalysisAlgorithmType.TSNE]: {
    displayName: 't-SNE',
    description: 't-Distributed Stochastic Neighbour Embedding — visualisation-focused 2D/3D projection.',
    runType: AnalysisRunType.DIM_REDUCTION,
    supportedTasks: ['dim_reduction'],
    hyperparams: {
      n_components:       { type: 'int',   default: 2,    min: 1,  max: 3,    description: 'Number of output dimensions (typically 2)' },
      perplexity:         { type: 'float', default: 30.0, min: 5.0, max: 200.0, description: 'Perplexity — typical local neighborhood size' },
      learning_rate:      { type: 'float', default: 200.0, min: 10.0, max: 1000.0, description: 't-SNE learning rate' },
      n_iter:             { type: 'int',   default: 1000, min: 250, max: 10000, description: 'Number of optimisation iterations' },
      metric:             { type: 'enum',  default: 'euclidean', choices: ['euclidean', 'cosine', 'precomputed'], description: 'Input space metric' },
    },
  },

  [AnalysisAlgorithmType.NMF]: {
    displayName: 'NMF',
    description: 'Non-negative Matrix Factorisation — parts-based decomposition.',
    runType: AnalysisRunType.DIM_REDUCTION,
    supportedTasks: ['dim_reduction'],
    hyperparams: {
      n_components:       { type: 'int',   default: 16,   min: 1,             description: 'Number of latent components' },
      init:               { type: 'enum',  default: 'nndsvda', choices: ['random', 'nndsvd', 'nndsvda', 'nndsvdar'], description: 'Initialisation strategy' },
      max_iter:           { type: 'int',   default: 200,  min: 50, max: 10000, description: 'Maximum iterations' },
      alpha_W:            { type: 'float', default: 0.0,  min: 0.0,           description: 'Regularisation for W matrix' },
      alpha_H:            { type: 'float', default: 0.0,  min: 0.0,           description: 'Regularisation for H matrix' },
    },
  },

  [AnalysisAlgorithmType.ICA]: {
    displayName: 'ICA',
    description: 'Independent Component Analysis — separates statistically independent sources.',
    runType: AnalysisRunType.DIM_REDUCTION,
    supportedTasks: ['dim_reduction'],
    hyperparams: {
      n_components:       { type: 'int',   default: null, min: 1, description: 'Number of independent components' },
      algorithm:          { type: 'enum',  default: 'parallel', choices: ['parallel', 'deflation'], description: 'FastICA update variant' },
      fun:                { type: 'enum',  default: 'logcosh',  choices: ['logcosh', 'exp', 'cube'],  description: 'Approximation to neg-entropy' },
      max_iter:           { type: 'int',   default: 200,  min: 50, max: 10000, description: 'Maximum iterations' },
    },
  },

  [AnalysisAlgorithmType.FACTOR_ANALYSIS]: {
    displayName: 'Factor Analysis',
    description: 'Probabilistic latent factor model — explains variance via shared factors.',
    runType: AnalysisRunType.DIM_REDUCTION,
    supportedTasks: ['dim_reduction'],
    hyperparams: {
      n_components:       { type: 'int',   default: null, min: 1, description: 'Number of latent factors' },
      max_iter:           { type: 'int',   default: 1000, min: 50, max: 10000, description: 'EM iterations' },
      rotation:           { type: 'enum',  default: null, choices: ['varimax', 'quartimax'], description: 'Post-hoc rotation (null = none)' },
    },
  },

  // ── Custom ───────────────────────────────────────────────────────────────────

  [AnalysisAlgorithmType.CUSTOM]: {
    displayName: 'Custom Algorithm',
    description: 'User-defined algorithm — hyperparameters specified freely in configJson.',
    runType: AnalysisRunType.CUSTOM,
    supportedTasks: ['binary_classification', 'multiclass', 'regression', 'clustering', 'survival', 'dim_reduction', 'anomaly_detection', 'generation'],
    hyperparams: {},
  },
};

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface CreateAnalysisRunDto {
  researchWorkspaceId: string;
  type: AnalysisRunType;
  algorithm?: AnalysisAlgorithmType;
  configJson: Record<string, unknown>;
  datasetVersionRef?: string;
  featureSetVersionRef?: string;
}

export interface AnalysisRunDto {
  id: string;
  researchWorkspaceId: string;
  type: AnalysisRunType;
  algorithm?: AnalysisAlgorithmType;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
  configJson: Record<string, unknown>;
  metricsJson?: Record<string, unknown>;
  artifactsJson?: Record<string, unknown>;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Service class ────────────────────────────────────────────────────────────

export class AnalysisOrchestratorModule {
  /** Returns the full algorithm catalog with metadata and default hyperparameters. */
  getAlgorithmCatalog(): typeof ALGORITHM_CATALOG {
    return ALGORITHM_CATALOG;
  }

  /** Returns all algorithms that belong to a specific high-level run type. */
  getAlgorithmsByType(type: AnalysisRunType): Array<{ algorithm: AnalysisAlgorithmType; meta: AlgorithmMetadata }> {
    return (Object.entries(ALGORITHM_CATALOG) as Array<[AnalysisAlgorithmType, AlgorithmMetadata]>)
      .filter(([, meta]) => meta.runType === type)
      .map(([algorithm, meta]) => ({ algorithm, meta }));
  }

  /** Returns the default hyperparameter values for a given algorithm. */
  getDefaultHyperparams(algorithm: AnalysisAlgorithmType): Record<string, unknown> {
    const meta = ALGORITHM_CATALOG[algorithm];
    return Object.fromEntries(
      Object.entries(meta.hyperparams).map(([key, def]) => [key, def.default])
    );
  }

  async createAnalysisRun(dto: CreateAnalysisRunDto): Promise<AnalysisRunDto> {
    const workspace = await prisma.researchWorkspace.findUnique({ where: { id: dto.researchWorkspaceId }, select: { id: true } });
    if (!workspace) {
      throw new HttpError(404, 'Research workspace not found');
    }

    if (dto.algorithm) {
      const algoMeta = ALGORITHM_CATALOG[dto.algorithm];
      if (!algoMeta) {
        throw new HttpError(400, `Unsupported algorithm: ${dto.algorithm}`);
      }
      if (dto.type !== AnalysisRunType.CUSTOM && algoMeta.runType !== dto.type) {
        throw new HttpError(400, 'Algorithm is not compatible with requested analysis run type');
      }
    }

    const run = await prisma.analysisRun.create({
      data: {
        researchWorkspaceId: dto.researchWorkspaceId,
        type: dto.type as unknown as PrismaAnalysisRunType,
        algorithm: dto.algorithm ? (dto.algorithm as unknown as PrismaAnalysisAlgorithmType) : undefined,
        status: PrismaAnalysisRunStatus.QUEUED,
        configJson: dto.configJson as Prisma.InputJsonValue,
        datasetVersionRef: dto.datasetVersionRef,
        featureSetVersionRef: dto.featureSetVersionRef,
      },
    });

    return {
      id: run.id,
      researchWorkspaceId: run.researchWorkspaceId,
      type: run.type as unknown as AnalysisRunType,
      algorithm: (run.algorithm as unknown as AnalysisAlgorithmType | null) ?? undefined,
      status: run.status,
      configJson: (run.configJson ?? {}) as Record<string, unknown>,
      metricsJson: (run.metricsJson ?? undefined) as Record<string, unknown> | undefined,
      artifactsJson: (run.artifactsJson ?? undefined) as Record<string, unknown> | undefined,
      startedAt: run.startedAt ?? undefined,
      finishedAt: run.finishedAt ?? undefined,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    };
  }

  async getAnalysisRunById(id: string): Promise<AnalysisRunDto> {
    const run = await prisma.analysisRun.findUnique({ where: { id } });
    if (!run) {
      throw new HttpError(404, 'Analysis run not found');
    }

    return {
      id: run.id,
      researchWorkspaceId: run.researchWorkspaceId,
      type: run.type as unknown as AnalysisRunType,
      algorithm: (run.algorithm as unknown as AnalysisAlgorithmType | null) ?? undefined,
      status: run.status,
      configJson: (run.configJson ?? {}) as Record<string, unknown>,
      metricsJson: (run.metricsJson ?? undefined) as Record<string, unknown> | undefined,
      artifactsJson: (run.artifactsJson ?? undefined) as Record<string, unknown> | undefined,
      startedAt: run.startedAt ?? undefined,
      finishedAt: run.finishedAt ?? undefined,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    };
  }

  async listAnalysisRuns(workspaceId: string): Promise<AnalysisRunDto[]> {
    const runs = await prisma.analysisRun.findMany({
      where: { researchWorkspaceId: workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return runs.map((run) => ({
      id: run.id,
      researchWorkspaceId: run.researchWorkspaceId,
      type: run.type as unknown as AnalysisRunType,
      algorithm: (run.algorithm as unknown as AnalysisAlgorithmType | null) ?? undefined,
      status: run.status,
      configJson: (run.configJson ?? {}) as Record<string, unknown>,
      metricsJson: (run.metricsJson ?? undefined) as Record<string, unknown> | undefined,
      artifactsJson: (run.artifactsJson ?? undefined) as Record<string, unknown> | undefined,
      startedAt: run.startedAt ?? undefined,
      finishedAt: run.finishedAt ?? undefined,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    }));
  }

  async cancelAnalysisRun(id: string): Promise<void> {
    const run = await prisma.analysisRun.findUnique({ where: { id } });
    if (!run) {
      throw new HttpError(404, 'Analysis run not found');
    }

    if (run.status === PrismaAnalysisRunStatus.SUCCEEDED || run.status === PrismaAnalysisRunStatus.FAILED || run.status === PrismaAnalysisRunStatus.CANCELED) {
      throw new HttpError(409, `Analysis run cannot be canceled from status ${run.status}`);
    }

    await prisma.analysisRun.update({
      where: { id },
      data: {
        status: PrismaAnalysisRunStatus.CANCELED,
        finishedAt: new Date(),
      },
    });
  }

  async getAnalysisArtifacts(runId: string): Promise<Record<string, unknown>> {
    const run = await prisma.analysisRun.findUnique({
      where: { id: runId },
      select: { id: true, artifactsJson: true },
    });
    if (!run) {
      throw new HttpError(404, 'Analysis run not found');
    }

    return (run.artifactsJson ?? {}) as Record<string, unknown>;
  }
}

