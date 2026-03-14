"""
Cyberbullying Detection Model Training Script
Trains multiple ML classifiers on the cyberbullying_tweets.csv dataset,
compares their performance, and saves the best model + vectorizer.
"""

import os
import re
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

# ─── Configuration ───────────────────────────────────────────────────────────
DATASET_PATH = os.path.join(os.path.dirname(__file__), '..', 'cyberbullying_tweets.csv')
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
os.makedirs(MODEL_DIR, exist_ok=True)


def preprocess_text(text):
    """Clean and preprocess tweet text."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'@\w+', '', text)           # Remove mentions
    text = re.sub(r'http\S+|www\S+', '', text)  # Remove URLs
    text = re.sub(r'#(\w+)', r'\1', text)       # Remove # but keep word
    text = re.sub(r'[^a-zA-Z\s]', '', text)     # Remove special chars/numbers
    text = re.sub(r'\s+', ' ', text).strip()     # Remove extra whitespace
    return text


def load_and_prepare_data():
    """Load dataset and prepare binary classification labels."""
    print("📂 Loading dataset...")
    df = pd.read_csv(DATASET_PATH)
    print(f"   Dataset shape: {df.shape}")
    print(f"   Columns: {list(df.columns)}")

    # Show class distribution
    print("\n📊 Original class distribution:")
    print(df['cyberbullying_type'].value_counts())

    # Binary classification: cyberbullying (1) vs not (0)
    df['label'] = df['cyberbullying_type'].apply(
        lambda x: 0 if x == 'not_cyberbullying' else 1
    )
    
    # Balance the dataset (Downsample cyberbullying class to match not_cyberbullying)
    df_majority = df[df.label == 1]
    df_minority = df[df.label == 0]
    
    # Downsample majority class
    df_majority_downsampled = df_majority.sample(n=len(df_minority), random_state=42)
    
    # Combine minority class with downsampled majority class
    df = pd.concat([df_majority_downsampled, df_minority]).sample(frac=1, random_state=42).reset_index(drop=True)

    print(f"\n📊 Balanced Binary distribution:")
    print(f"   Not cyberbullying: {(df['label'] == 0).sum()}")
    print(f"   Cyberbullying:     {(df['label'] == 1).sum()}")

    # Preprocess text
    print("\n🔄 Preprocessing text...")
    df['cleaned_text'] = df['tweet_text'].apply(preprocess_text)

    # Remove empty rows
    df = df[df['cleaned_text'].str.len() > 0]
    print(f"   After cleaning: {len(df)} samples")

    return df


def train_and_evaluate():
    """Train multiple models, evaluate, and save the best one."""
    df = load_and_prepare_data()

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        df['cleaned_text'], df['label'],
        test_size=0.2, random_state=42, stratify=df['label']
    )
    print(f"\n📐 Train/Test split: {len(X_train)} / {len(X_test)}")

    # TF-IDF Vectorization
    print("\n🔤 Building TF-IDF features (max 10,000)...")
    vectorizer = TfidfVectorizer(
        max_features=10000,
        ngram_range=(1, 2),
        stop_words='english',
        min_df=2,
        max_df=0.95
    )
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)
    print(f"   Feature matrix shape: {X_train_tfidf.shape}")

    # Define classifiers
    classifiers = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Naive Bayes': MultinomialNB(alpha=0.1),
        'SVM (LinearSVC)': LinearSVC(max_iter=2000, random_state=42),
        'SGD Classifier': SGDClassifier(loss='hinge', max_iter=1000, random_state=42),
    }

    results = {}
    best_model = None
    best_f1 = 0
    best_name = ""

    print("\n" + "=" * 60)
    print("🤖 TRAINING & EVALUATING MODELS")
    print("=" * 60)

    for name, clf in classifiers.items():
        print(f"\n▶ Training {name}...")
        clf.fit(X_train_tfidf, y_train)
        y_pred = clf.predict(X_test_tfidf)

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)

        results[name] = {
            'accuracy': round(acc, 4),
            'precision': round(prec, 4),
            'recall': round(rec, 4),
            'f1_score': round(f1, 4),
        }

        print(f"   Accuracy:  {acc:.4f}")
        print(f"   Precision: {prec:.4f}")
        print(f"   Recall:    {rec:.4f}")
        print(f"   F1-Score:  {f1:.4f}")

        if f1 > best_f1:
            best_f1 = f1
            best_model = clf
            best_name = name

    # Print classification report for best model
    print(f"\n{'=' * 60}")
    print(f"🏆 BEST MODEL: {best_name} (F1: {best_f1:.4f})")
    print(f"{'=' * 60}")
    y_pred_best = best_model.predict(X_test_tfidf)
    print("\nDetailed Classification Report:")
    print(classification_report(y_test, y_pred_best,
                                target_names=['Not Cyberbullying', 'Cyberbullying']))

    # Save model, vectorizer, and metrics
    print("\n💾 Saving model artifacts...")
    joblib.dump(best_model, os.path.join(MODEL_DIR, 'model.pkl'))
    joblib.dump(vectorizer, os.path.join(MODEL_DIR, 'vectorizer.pkl'))

    metrics = {
        'best_model': best_name,
        'all_results': results,
    }
    with open(os.path.join(MODEL_DIR, 'metrics.json'), 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"   ✅ Model saved to:      {os.path.join(MODEL_DIR, 'model.pkl')}")
    print(f"   ✅ Vectorizer saved to:  {os.path.join(MODEL_DIR, 'vectorizer.pkl')}")
    print(f"   ✅ Metrics saved to:     {os.path.join(MODEL_DIR, 'metrics.json')}")
    print("\n🎉 Training complete!")

    return results


if __name__ == '__main__':
    train_and_evaluate()
