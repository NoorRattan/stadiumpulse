from pydantic import BaseModel, ConfigDict, Field


class AccessibilitySettings(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    high_contrast: bool = Field(default=False, alias="highContrast")
    reduced_motion: bool = Field(default=False, alias="reducedMotion")
    screen_reader_mode: bool = Field(default=False, alias="screenReaderMode")
    preferred_language: str = Field(default="en", alias="preferredLanguage", min_length=2, max_length=12)
