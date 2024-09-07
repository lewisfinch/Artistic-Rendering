#version 300 es

precision mediump float;

#define POINT_LIGHT 0
#define DIRECTIONAL_LIGHT 1

const int MAX_LIGHTS = 8;

uniform vec3 eyePosition;

uniform int numLights;
uniform int lightTypes[MAX_LIGHTS];
uniform vec3 lightPositions[MAX_LIGHTS];
uniform vec3 ambientIntensities[MAX_LIGHTS];
uniform vec3 diffuseIntensities[MAX_LIGHTS];
uniform vec3 specularIntensities[MAX_LIGHTS];

uniform vec3 kAmbient;
uniform vec3 kDiffuse;
uniform vec3 kSpecular;
uniform float shininess;
uniform int blinn;

uniform int useTexture;
uniform sampler2D textureImage;

uniform sampler2D diffuseRamp;
uniform sampler2D specularRamp;

in vec3 vertPosition;
in vec3 vertNormal;
in vec4 vertColor;
in vec2 uv;

out vec4 fragColor;

void main() 
{
    // Normalize the interpolated normal vector
    vec3 n = normalize(vertNormal);

    vec3 illumination = vec3(0, 0, 0);
    for(int i=0; i < numLights; i++)
    {
        // Ambient component
        illumination += kAmbient * ambientIntensities[i];

        // Compute the vector from the vertex position to the light
        vec3 l;
        if(lightTypes[i] == DIRECTIONAL_LIGHT)
            l = normalize(lightPositions[i]);
        else
            l = normalize(lightPositions[i] - vertPosition);

        // Diffuse component
        float diffuseComponent = max(dot(n, l), -1.0);
        float diffuseIntensity = (diffuseComponent + 1.0) * 0.5; 
        vec3 diffuseColor = texture(diffuseRamp, vec2(diffuseIntensity, 0.5)).rgb;
        illumination += diffuseColor * kDiffuse * diffuseIntensities[i];

        // Compute the vector from the vertex to the eye
        vec3 e = normalize(eyePosition - vertPosition);

        // Blinn-Phong reflection model
        if(blinn != 0)
        {
            // Compute the halfway vector
            vec3 h = normalize(l + e);

            // Specular component
            float specularComponent = pow(max(dot(h, n), 0.0), shininess);
            float specularIntensity = clamp(specularComponent, 0.0, 1.0);
            vec3 specularColor = texture(specularRamp, vec2(specularIntensity, 0.5)).rgb;
            illumination += specularColor * kSpecular * specularIntensities[i];
        }
        // Phong reflection model
        else
        {
            // Compute the light vector reflected about the normal
            vec3 r = reflect(-l, n);

            // Specular component
            float specularComponent = pow(max(dot(e, r), 0.0), shininess);
            float specularIntensity = clamp(specularComponent, 0.0, 1.0);
            vec3 specularColor = texture(specularRamp, vec2(specularIntensity, 0.5)).rgb;
            illumination += specularColor * kSpecular * specularIntensities[i];
        }
    }

    fragColor = vertColor;
    fragColor.rgb *= illumination;

    if(useTexture != 0)
    {
        fragColor *= texture(textureImage, uv);
    }
}