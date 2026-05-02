import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier

print("STEP 1: Loading Training.csv dataset...")

df = pd.read_csv("data/Training.csv")

print("Dataset Loaded Successfully")
print(df.head())

print("Columns:", df.columns)

# Last column is prognosis (target)
X = df.drop("prognosis", axis=1)
y = df["prognosis"]

print("STEP 2: Encoding disease labels...")

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

print("STEP 3: Splitting dataset...")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.2,
    random_state=42
)

print("STEP 4: Training model...")

model = RandomForestClassifier(
    n_estimators=300,
    random_state=42
)

model.fit(X_train, y_train)

accuracy = model.score(X_test, y_test)

print(f"Model Accuracy: {accuracy * 100:.2f}%")

print("STEP 5: Saving model files...")

joblib.dump(model, "disease_model.pkl")
joblib.dump(label_encoder, "disease_label_encoder.pkl")
joblib.dump(list(X.columns), "symptom_columns.pkl")

print("SUCCESS: Advanced Disease Model Training Complete")
