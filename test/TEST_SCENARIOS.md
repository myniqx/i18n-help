# i18n-help Test Scenarios

Bu dosya i18n-help tool'unu test etmek için hazırlanmış senaryoları içerir.

## Test Environment Struktur

```
test/
├── i18n-format/           # Geleneksel i18n format (isIntl: false)
│   ├── locales/
│   │   ├── en/common.json
│   │   ├── tr/common.json
│   │   └── de/common.json
│   └── i18nHelper.config.json
├── intl-format/           # Modern intl format (isIntl: true)
│   ├── locales/
│   │   ├── en.json
│   │   ├── tr.json
│   │   └── de.json
│   └── i18nHelper.config.json
└── TEST_SCENARIOS.md
```

## Test Senaryoları

### 1. FIND Komut Testleri

#### i18n Format Testleri (test/i18n-format/ dizininde)
```bash
cd test/i18n-format

# Key'de arama
i18nHelp find login --search-in key
i18nHelp find button --search-in key

# Value'da arama  
i18nHelp find "Log In" --search-in value
i18nHelp find "Giriş" --search-in value --locale tr

# Her ikisinde arama
i18nHelp find hello --search-in both
```

#### intl Format Testleri (test/intl-format/ dizininde)
```bash
cd test/intl-format

# Nested key arama
i18nHelp find navigation --search-in key
i18nHelp find form.login --search-in key

# Value arama
i18nHelp find "Home" --search-in value
i18nHelp find "Ana Sayfa" --search-in value --locale tr

# Mixed arama
i18nHelp find contact --search-in both
```

### 2. ADD Komut Testleri

#### i18n Format (test/i18n-format/ dizininde)
```bash
cd test/i18n-format

# Basit key ekleme
i18nHelp add testKey "Test Value"

# Overwrite test
i18nHelp add hello "Hello Updated" --overwrite

# Manual locale değerleri
i18nHelp add newButton "New Button" --locale tr="Yeni Buton" --locale de="Neue Schaltfläche"

# Key case validation testleri
i18nHelp add test_key "Invalid Case"        # Error vermeli
i18nHelp add test_key "Fixed Case" --auto-fix    # testKey'e dönüştürmeli
i18nHelp add INVALID_KEY "Skip Validation" --skip-validation  # Geçmeli
```

#### intl Format (test/intl-format/ dizininde)
```bash
cd test/intl-format

# Flat key ekleme
i18nHelp add newFeature "New Feature"

# Nested key ekleme
i18nHelp add settings.theme "Theme Settings"
i18nHelp add user.profile.name "Profile Name"

# Existing key overwrite
i18nHelp add navigation.home "Home Updated" --overwrite

# Key validation testleri
i18nHelp add invalid_nested.key "Bad Case"        # Error
i18nHelp add invalid_nested.key "Auto Fix" --auto-fix    # Fix edilmeli
```

### 3. DELETE Komut Testleri

#### i18n Format
```bash
cd test/i18n-format

# Exact delete
i18nHelp delete testKey

# Selective delete
i18nHelp delete button --selective  # button içeren tüm key'leri listele
```

#### intl Format  
```bash
cd test/intl-format

# Flat key delete
i18nHelp delete newFeature

# Nested key delete
i18nHelp delete navigation.contact
i18nHelp delete user.profile.name

# Selective delete
i18nHelp delete form --selective    # form içeren path'leri listele
```

### 4. UNUSED Komut Testleri

```bash
# Test için dummy kaynak dosyalar oluştur
mkdir -p src
echo 'const text = t("hello")' > src/component.tsx
echo 'const label = t("loginButton")' > src/form.tsx

# Her iki formatta test
cd test/i18n-format
i18nHelp unused ../../src

cd ../intl-format  
i18nHelp unused ../../src
```

### 5. Edge Case Testleri

```bash
# Var olmayan key'lerde arama
i18nHelp find nonexistentkey

# Boş value ile ekleme
i18nHelp add emptyValue ""

# Özel karakterler
i18nHelp add specialChars "Value with üöğışç characters"

# Çok uzun key
i18nHelp add veryLongKeyNameThatShouldStillWork "Long key test"
```

## Beklenen Sonuçlar

- **find**: Partial matching yapmalı, case-insensitive olmalı
- **add**: DeepL entegrasyonu ile auto-translate olmalı (API key varsa)
- **delete**: Nested cleanup yapmalı (intl'de)
- **validation**: keyCase kurallarını uygulamalı
- **unused**: Kaynak kodda kullanılmayan key'leri bulmalı

## Test Sonrası Temizlik

```bash
# Test verilerini sıfırla
git checkout test/
```