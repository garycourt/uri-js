#!/bin/bash

ROOT_DIR="../"
SRC_DIR=${ROOT_DIR}"src/"
DIST_DIR=${ROOT_DIR}"dist/"
ALL_LIST=( ${SRC_DIR}"/uri.js" )
ALL_FILE=${DIST_DIR}"/uri.js"

COMPILER_JAR=${ROOT_DIR}"bin/closure/compiler.jar"
COMPILE_OPTIONS="--jscomp_off nonStandardJsDocs --jscomp_warning checkTypes --jscomp_warning checkRegExp --jscomp_warning checkVars --jscomp_warning deprecated --jscomp_warning invalidCasts --jscomp_warning missingProperties --jscomp_warning undefinedVars --jscomp_warning unknownDefines --jscomp_warning visibility"

#
# Targets
#

function clean {
	rm -r -f ${DIST_DIR}
}

function setup {
	mkdir ${DIST_DIR}
}

function concat {
	local CAT_LIST=$1
	local LENGTH=${#CAT_LIST[@]}
	local OUT_FILE=$2
	
	for ((i=0;i<${LENGTH};i++)); do
		cat ${CAT_LIST[${i}]} >> ${OUT_FILE}
	done
}

function simple_compile {
	local FILE=$1
	local IN_FILE=$1".tmp"
	local OUT_FILE=$1

	mv ${FILE} ${IN_FILE}
	java -jar ${COMPILER_JAR} --js ${IN_FILE} --js_output_file ${OUT_FILE} --compilation_level SIMPLE_OPTIMIZATIONS ${COMPILE_OPTIONS}
	rm ${IN_FILE}
}

function advanced_compile {
	local FILE=$1
	local IN_FILE=$1".tmp"
	local OUT_FILE=$1

	mv ${FILE} ${IN_FILE}
	java -jar ${COMPILER_JAR} --js ${IN_FILE} --js_output_file ${OUT_FILE} --compilation_level ADVANCED_OPTIMIZATIONS ${COMPILE_OPTIONS}
	rm ${IN_FILE}
}

#
# Operations
#

clean
setup
concat ${ALL_LIST} ${ALL_FILE}
simple_compile ${ALL_FILE}
