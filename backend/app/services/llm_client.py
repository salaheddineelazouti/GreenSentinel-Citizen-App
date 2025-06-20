"""
LLM client for validating alert descriptions using OpenAI.
"""
import json
from typing import Tuple

import openai
from openai.types.chat import ChatCompletion

from app.config import settings

# Prompt template for validating alert descriptions
PROMPT_TEMPLATE = (
    "Tu es un modérateur. Vérifie que la description suivante correspond bien "
    "à un incendie forestier réel et n'est pas un spam.\n"
    "Catégorie: {type}\n"
    "Description: \"{description}\"\n"
    "Réponds strictement par JSON: {{\"valid\":true/false, \"score\":0-1}}"
)


async def verify_description(type_: str, description: str) -> Tuple[bool, float]:
    """
    Verify if an alert description is legitimate using OpenAI.

    Args:
        type_: The alert type
        description: The alert description

    Returns:
        Tuple containing (is_valid, confidence_score)
    """
    client = openai.AsyncOpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_api_base,
    )

    prompt = PROMPT_TEMPLATE.format(type=type_, description=description)

    try:
        response: ChatCompletion = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[{"role": "system", "content": prompt}],
            max_tokens=100,
            temperature=0.1,
        )

        # Extract the JSON response
        content = response.choices[0].message.content
        if not content:
            return False, 0.0

        try:
            result = json.loads(content)
            return result.get("valid", False), result.get("score", 0.0)
        except json.JSONDecodeError:
            # Fallback in case the LLM doesn't return valid JSON
            return False, 0.0

    except Exception as e:
        # Log the error in a production environment
        print(f"Error calling OpenAI API: {str(e)}")
        # Default to False in case of API error
        return False, 0.0
