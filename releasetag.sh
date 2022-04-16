# Get arguments
while getopts p:m:v: flag
do
    case "${flag}" in
        p) previous=${OPTARG};;
        m) matching=${OPTARG};;
        v) version=${OPTARG};;
    esac
done

# Find last release
LAST_MATCHING_TAG=$(git describe --match "${matching:-release/*}" HEAD --tags --abbrev=0)
LAST_RELEASE_TAG=${previous:-$LAST_MATCHING_TAG}

# Get history
if [ -z ${LAST_RELEASE_TAG} ]
then
    echo 'No last release - defaulting to all history'
    RELEASE_NOTES=$(git log --format=oneline)
else
    echo $LAST_RELEASE_TAG
    RELEASE_NOTES=$(git log $LAST_RELEASE_TAG..HEAD --format=oneline)
fi

# TODO: Send notes to ReleaseTag API
echo '\n' $version 'NOTES:\n' $RELEASE_NOTES '\n'
